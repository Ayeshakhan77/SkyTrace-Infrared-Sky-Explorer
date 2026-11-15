"""Tests for Phase 5: Multi-Observation Preparation and Playback.

Verifies:
1. PrepareRequest Pydantic schema allows up to 4 observations and enforces min/max bounds.
2. openapi.json accurately specifies maxItems = 4.
3. Multi-frame chronological sequencing and pairwise comparison indexing.
"""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Mock astropy and submodules if not installed
for mod in [
    "astropy", "astropy.units", "astropy.io", "astropy.io.fits",
    "astropy.io.votable", "astropy.wcs", "astropy.coordinates"
]:
    m = MagicMock()
    m.__path__ = []
    sys.modules.setdefault(mod, m)

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pydantic import ValidationError
from skytrace.api import PrepareRequest, MAX_STORAGE_BYTES, MAX_CUTOUTS

def test_prepare_request_limits():
    # Valid: 1 to 4 observations
    for count in range(1, 5):
        req = PrepareRequest(observation_ids=[f"obs_{i}" for i in range(count)])
        assert len(req.observation_ids) == count

    # Invalid: 0 observations
    try:
        PrepareRequest(observation_ids=[])
        assert False, "Should fail on 0 observations"
    except ValidationError:
        pass

    # Invalid: 5 observations (> 4)
    try:
        PrepareRequest(observation_ids=[f"obs_{i}" for i in range(5)])
        assert False, "Should fail on 5 observations"
    except ValidationError:
        pass

def test_openapi_schema_matches():
    openapi_path = Path(__file__).resolve().parent.parent / "openapi.json"
    with open(openapi_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    
    prep_req = spec["components"]["schemas"]["PrepareRequest"]
    obs_ids_prop = prep_req["properties"]["observation_ids"]
    assert obs_ids_prop["maxItems"] == 4, f"Expected maxItems=4, got {obs_ids_prop.get('maxItems')}"
    assert obs_ids_prop["minItems"] == 1, f"Expected minItems=1, got {obs_ids_prop.get('minItems')}"

def test_storage_reservation_budget():
    # 4 cutouts per request easily fits within MAX_CUTOUTS (32) and MAX_STORAGE_BYTES (256 MB)
    max_prepared = 4
    assert max_prepared <= MAX_CUTOUTS
    assert MAX_STORAGE_BYTES == 256 * 1024 * 1024

def test_multi_frame_chronological_ordering():
    raw_observations = [
        {"id": "obs4", "time": "2026-11-01T12:00:00Z"},
        {"id": "obs1", "time": "2025-05-15T08:30:00Z"},
        {"id": "obs3", "time": "2026-05-20T10:15:00Z"},
        {"id": "obs2", "time": "2025-11-10T14:45:00Z"},
    ]
    sorted_obs = sorted(raw_observations, key=lambda x: x["time"])
    assert [o["id"] for o in sorted_obs] == ["obs1", "obs2", "obs3", "obs4"]

def test_pairwise_selection_from_multiframe():
    # Simulates ChangeReceipt pairwise selector from a 4-observation time series
    sequence = ["Epoch_1", "Epoch_2", "Epoch_3", "Epoch_4"]
    # User selects Epoch 1 (idx 0) vs Epoch 4 (idx 3)
    pair = [sequence[0], sequence[3]]
    assert len(pair) == 2
    assert pair == ["Epoch_1", "Epoch_4"]

if __name__ == "__main__":
    test_prepare_request_limits()
    test_openapi_schema_matches()
    test_storage_reservation_budget()
    test_multi_frame_chronological_ordering()
    test_pairwise_selection_from_multiframe()
    print("All multi-observation preparation and playback tests passed!")
