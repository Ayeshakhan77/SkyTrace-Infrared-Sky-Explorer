"""Test coordinate parsing and validation edge cases matching frontend/src/services/api.ts."""

import re

def sanitize_coord_string(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[−–—\u2212\u2013\u2014]", "-", s.strip()))

def parse_ra(s: str) -> float:
    clean = sanitize_coord_string(s)
    if not clean:
        raise ValueError("Empty RA")
    if re.match(r"^[+]?\d+(\.\d+)?$", clean):
        v = float(clean)
        if not (0 <= v < 360):
            raise ValueError("RA out of range")
        return v
    parts = [float(x) for x in re.findall(r"[\d.]+", clean)]
    if not (1 <= len(parts) <= 3):
        raise ValueError("Invalid sexagesimal RA")
    h = parts[0]
    m = parts[1] if len(parts) > 1 else 0.0
    sec = parts[2] if len(parts) > 2 else 0.0
    if not (0 <= h < 24) or not (0 <= m < 60) or not (0 <= sec < 60):
        raise ValueError("RA components out of range")
    v = (h + m / 60.0 + sec / 3600.0) * 15.0
    if not (0 <= v < 360):
        raise ValueError("RA out of range")
    return v

def parse_dec(s: str) -> float:
    clean = sanitize_coord_string(s)
    if not clean:
        raise ValueError("Empty Dec")
    if re.match(r"^[+-]?\d+(\.\d+)?$", clean):
        v = float(clean)
        if not (-90 <= v <= 90):
            raise ValueError("Dec out of range")
        return v
    sign = -1.0 if clean.startswith("-") else 1.0
    parts = [float(x) for x in re.findall(r"[\d.]+", clean)]
    if not (1 <= len(parts) <= 3):
        raise ValueError("Invalid sexagesimal Dec")
    d = parts[0]
    m = parts[1] if len(parts) > 1 else 0.0
    sec = parts[2] if len(parts) > 2 else 0.0
    if not (0 <= d <= 90) or not (0 <= m < 60) or not (0 <= sec < 60):
        raise ValueError("Dec components out of range")
    v = sign * (d + m / 60.0 + sec / 3600.0)
    if not (-90 <= v <= 90):
        raise ValueError("Dec out of range")
    return v


def test_coordinates():
    # 1. WISE 0855 official challenge coordinates
    ra_w = parse_ra("08h 55m 10.831s")
    dec_w = parse_dec("-07d 14m 42.53s")
    assert round(ra_w, 4) == 133.7951
    assert round(dec_w, 4) == -7.2451

    # 2. Unicode minus signs
    dec_uni = parse_dec("−07° 14′ 42.53″")
    assert round(dec_uni, 4) == -7.2451

    # 3. Colon-separated format
    ra_col = parse_ra("08:55:10.831")
    dec_col = parse_dec("-07:14:42.53")
    assert round(ra_col, 4) == 133.7951
    assert round(dec_col, 4) == -7.2451

    # 4. Pure decimal degrees
    assert parse_ra("133.7951") == 133.7951
    assert parse_dec("-7.2451") == -7.2451

    # 5. Out of bounds detection
    try:
        parse_ra("360.5")
        assert False, "Should fail RA >= 360"
    except ValueError:
        pass

    try:
        parse_dec("-95.0")
        assert False, "Should fail Dec < -90"
    except ValueError:
        pass

    try:
        parse_ra("25h 10m 00s")
        assert False, "Should fail RA hour >= 24"
    except ValueError:
        pass

    print("All coordinate tests passed!")


if __name__ == "__main__":
    test_coordinates()
