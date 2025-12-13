from __future__ import annotations

import random
from pathlib import Path

from factory.types import CandidateAsset
from factory.workshops.workshop0 import Workshop0, Workshop0Paths


def _dedupe_keep_order(items: list[str]) -> list[str]:
	seen: set[str] = set()
	out: list[str] = []
	for item in items:
		if item in seen:
			continue
		seen.add(item)
		out.append(item)
	return out


def _assert_no_duplicates(items: list[str]) -> None:
	assert len(items) == len(set(items))


def _make_candidate(
	*,
	aid: str,
	channel_id: str,
	channel_name: str,
	detail_url: str | None,
	tags: list[str],
	updated_at: str,
) -> CandidateAsset:
	return CandidateAsset(
		aid=aid,
		channel_id=channel_id,
		detail_url=detail_url,
		file_path=None,
		cover_path=None,
		meta={
			'aid': aid,
			'title': f'Title-{aid}',
			'channelId': channel_id,
			'channelName': channel_name,
			'tags': tags,
			'updatedAt': updated_at,
			'detailUrl': detail_url,
		},
	)


def test_property3_merge_idempotence_and_union_info(tmp_path: Path) -> None:
	# Workshop0.merge_duplicates does not require real downloads, but needs a paths object.
	w0 = Workshop0(
		Workshop0Paths(
			downloads_root=tmp_path / 'downloads',
			crawler_db_path=tmp_path / 'crawler.db',
		)
	)

	candidates: list[CandidateAsset] = [
		_make_candidate(
			aid='1',
			channel_id='a',
			channel_name='Channel-A',
			detail_url='https://example.com/1',
			tags=['t1', 't2'],
			updated_at='2025-12-10',
		),
		_make_candidate(
			aid='1',
			channel_id='b',
			channel_name='Channel-B',
			detail_url='https://example.com/1',
			tags=['t2', 't3'],
			updated_at='2025-12-11',
		),
		_make_candidate(
			aid='2',
			channel_id='a',
			channel_name='Channel-A',
			detail_url='https://example.com/2',
			tags=['x'],
			updated_at='2025-12-01',
		),
		_make_candidate(
			aid='2',
			channel_id='a',
			channel_name='Channel-A',
			detail_url='https://example.com/2',
			tags=['x', 'y'],
			updated_at='2025-12-02',
		),
		_make_candidate(
			aid='3',
			channel_id='c',
			channel_name='Channel-C',
			detail_url=None,
			tags=[],
			updated_at='2025-11-30',
		),
	]

	merged1 = w0.merge_duplicates(candidates)
	merged2 = w0.merge_duplicates(candidates)
	assert [(m.aid, m.detail_url) for m in merged1] == [(m.aid, m.detail_url) for m in merged2]

	# Unique (aid, detail_url) pairs (aid uniqueness is the primary requirement).
	pairs = [(m.aid, m.detail_url) for m in merged1]
	assert len(pairs) == len(set(pairs))

	# Union info correctness per aid.
	by_aid: dict[str, list[CandidateAsset]] = {}
	for c in candidates:
		by_aid.setdefault(c.aid, []).append(c)

	for asset in merged1:
		group = by_aid[asset.aid]
		expected_channel_ids = {c.channel_id for c in group}
		assert set(asset.channel_ids) == expected_channel_ids
		_assert_no_duplicates(asset.channel_ids)

		expected_channel_names = {
			str(c.meta.get('channelName') or c.channel_id).strip() for c in group
		}
		assert set(asset.channel_names) == expected_channel_names
		_assert_no_duplicates(asset.channel_names)

		expected_tags: list[str] = []
		for c in group:
			raw = c.meta.get('tags') or []
			if isinstance(raw, str):
				raw = [raw]
			if isinstance(raw, list):
				expected_tags.extend([str(t).strip() for t in raw if str(t).strip()])
		expected_tag_set = set(_dedupe_keep_order(expected_tags))
		assert set(asset.original_tags) == expected_tag_set
		_assert_no_duplicates(asset.original_tags)

	# Idempotence: merge(merge(x)) == merge(x) (re-expand merged back to candidates).
	reexpanded: list[CandidateAsset] = []
	for asset in merged1:
		updated_at = (
			asset.origin_updated_at.strftime('%Y-%m-%d')
			if asset.origin_updated_at is not None
			else '1970-01-01'
		)
		for idx, channel_id in enumerate(asset.channel_ids):
			channel_name = asset.channel_names[idx] if idx < len(asset.channel_names) else channel_id
			reexpanded.append(
				_make_candidate(
					aid=asset.aid,
					channel_id=channel_id,
					channel_name=channel_name,
					detail_url=asset.detail_url,
					tags=list(asset.original_tags),
					updated_at=updated_at,
				)
			)

	# Ensure the merge result doesn't depend on input ordering.
	for seed in range(20):
		rng = random.Random(seed)
		shuffled = list(reexpanded)
		rng.shuffle(shuffled)
		merged_again = w0.merge_duplicates(shuffled)
		assert [
			(
				m.aid,
				m.channel_ids,
				m.channel_names,
				m.detail_url,
				m.original_tags,
				m.origin_updated_at,
			)
			for m in merged_again
		] == [
			(
				m.aid,
				m.channel_ids,
				m.channel_names,
				m.detail_url,
				m.original_tags,
				m.origin_updated_at,
			)
			for m in merged1
		]

