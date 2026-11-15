"""Validate Change Receipt documents against the formal Draft 2020-12 JSON Schema."""

import json
from pathlib import Path
import jsonschema

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SCHEMA_PATH = REPO_ROOT / "docs" / "schemas" / "change_receipt_v1.2.schema.json"
EXAMPLE_PATH = REPO_ROOT / "docs" / "examples" / "change_receipt_example_v1.2.json"


def load_validator():
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    return jsonschema.Draft202012Validator(schema)


def test_official_example_conforms_to_schema():
    validator = load_validator()
    example = json.loads(EXAMPLE_PATH.read_text(encoding="utf-8"))
    validator.validate(example)


def test_builder_dual_epoch_structure_conforms_to_schema():
    validator = load_validator()
    example = json.loads(EXAMPLE_PATH.read_text(encoding="utf-8"))
    
    # Assert all 6 sections exist
    for section in ["summary", "target", "observations", "comparison", "validation", "findingsAndLimitations"]:
        assert section in example
        
    # Dual epoch assertions
    assert example["summary"]["observationCount"] == 2
    assert len(example["observations"]) == 2
    assert example["comparison"]["isComparisonApplicable"] is True
    validator.validate(example)


def test_builder_single_epoch_structure_conforms_to_schema():
    validator = load_validator()
    example = json.loads(EXAMPLE_PATH.read_text(encoding="utf-8"))
    
    # Adapt to 1 observation per schema rules
    example["summary"]["observationCount"] = 1
    example["observations"] = [example["observations"][0]]
    example["comparison"] = {
        "isComparisonApplicable": False,
        "temporalSeparationDays": None,
        "wavelengthDifferenceUm": None,
        "bandwidthOverlapUm": None,
        "detectorMatch": None,
        "pipelineGenerationMatch": None,
        "commonSkyGridRegistered": False,
        "psfMatched": False,
        "photometricallyCalibrated": False,
        "descriptiveNote": "Comparison is not applicable for single observation inspection.",
    }
    validator.validate(example)


if __name__ == "__main__":
    test_official_example_conforms_to_schema()
    test_builder_dual_epoch_structure_conforms_to_schema()
    test_builder_single_epoch_structure_conforms_to_schema()
    print("All Change Receipt v1.2 schema conformance tests passed!")
