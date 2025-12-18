"""数据库模块测试 - Property 7: Database round-trip consistency"""
import tempfile
import pytest
from hypothesis import given, strategies as st

from lib.db import ProcessDB
from lib.models import Status


@pytest.fixture
def db():
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        yield ProcessDB(f.name)


# Property 7: Database round-trip consistency
@given(
    aid=st.text(min_size=1, max_size=10, alphabet=st.characters(whitelist_categories=('Nd', 'L'))),
    channel=st.sampled_from(['ppt_jieri', 'ppt_xiazai', 'ppt_moban', 'ppt_hangye']),
    slide_count=st.integers(min_value=0, max_value=100),
    preview_count=st.integers(min_value=0, max_value=5),
)
def test_round_trip_completed(aid, channel, slide_count, preview_count):
    """往返测试: 写入后读取应得到等价数据"""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        db = ProcessDB(f.name)
        preview_paths = [f'{aid}-preview_{i}.webp' for i in range(1, preview_count + 1)]
        
        db.mark_completed(aid, channel, slide_count, preview_paths)
        status = db.get_status(aid)
        
        assert status is not None
        assert status.aid == aid
        assert status.channel == channel
        assert status.status == Status.COMPLETED
        assert status.slide_count == slide_count
        assert status.preview_paths == preview_paths


def test_mark_failed_and_reset(db):
    """测试失败标记和重置"""
    db.mark_failed('test1', 'ppt_jieri', 'error msg')
    status = db.get_status('test1')
    assert status.status == Status.FAILED
    assert status.error_msg == 'error msg'
    
    count = db.reset_failed_to_pending('ppt_jieri')
    assert count == 1
    
    status = db.get_status('test1')
    assert status.status == Status.PENDING


def test_mark_archived(db):
    """测试归档标记"""
    db.mark_archived('test2', 'ppt_jieri', 3)
    status = db.get_status('test2')
    assert status.status == Status.ARCHIVED
    assert status.slide_count == 3


def test_get_stats(db):
    """测试统计功能"""
    db.mark_completed('a1', 'ppt_jieri', 10, [])
    db.mark_completed('a2', 'ppt_jieri', 12, [])
    db.mark_failed('a3', 'ppt_jieri', 'err')
    db.mark_archived('a4', 'ppt_jieri', 3)
    
    stats = db.get_stats('ppt_jieri')
    assert stats.get('COMPLETED', 0) == 2
    assert stats.get('FAILED', 0) == 1
    assert stats.get('ARCHIVED', 0) == 1
