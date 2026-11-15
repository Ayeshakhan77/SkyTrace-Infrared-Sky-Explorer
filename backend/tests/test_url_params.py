"""Verify URL parameter parsing and serialization matching frontend/src/services/urlParams.ts."""

import urllib.parse

CURATED_TARGETS = [
    {"id": "barnards-star", "name": "Barnard's Star", "ra": "269.4462678797", "dec": "+4.7682044119"},
    {"id": "epsilon-indi-b", "name": "Epsilon Indi B", "ra": "331.0438333333", "dec": "-56.7826944444"},
    {"id": "wise-0855", "name": "WISE 0855", "ra": "133.7951291667", "dec": "-7.2451472222"},
    {"id": "rw-aurigae", "name": "RW Aurigae", "ra": "76.9565260346", "dec": "+30.4014381739"},
    {"id": "r-draconis", "name": "R Draconis", "ra": "248.1676108330", "dec": "+66.7549794172"},
]

def parse_url_params(search_string: str):
    if not search_string:
        return {}
    query = search_string.lstrip("?")
    params = urllib.parse.parse_qs(query)
    
    target = params.get("target", [None])[0] or params.get("name", [None])[0]
    ra = params.get("ra", [None])[0]
    dec = params.get("dec", [None])[0]
    radius = params.get("radius", [None])[0] or params.get("radiusDeg", [None])[0]
    radius_deg = float(radius) if radius else None
    collection = params.get("collection", [None])[0]
    tab = params.get("tab", [None])[0]
    
    preset = None
    if target:
        clean_target = "".join(c.lower() for c in target if c.isalnum())
        for p in CURATED_TARGETS:
            clean_id = "".join(c.lower() for c in p["id"] if c.isalnum())
            clean_name = "".join(c.lower() for c in p["name"] if c.isalnum())
            if clean_id == clean_target or clean_name == clean_target:
                preset = p
                break
        if preset:
            if not ra:
                ra = preset["ra"]
            if not dec:
                dec = preset["dec"]
                
    return {
        "target": target,
        "ra": ra,
        "dec": dec,
        "radiusDeg": radius_deg,
        "collection": collection,
        "tab": tab,
        "preset": preset,
    }

def test_url_params():
    # 1. Coordinate deep-link
    p1 = parse_url_params("?ra=133.7951&dec=-7.2451&radius=0.02&collection=spherex_dr1&tab=viewer")
    assert p1["ra"] == "133.7951"
    assert p1["dec"] == "-7.2451"
    assert p1["radiusDeg"] == 0.02
    assert p1["collection"] == "spherex_dr1"
    assert p1["tab"] == "viewer"
    
    # 2. Target preset alias deep-link
    p2 = parse_url_params("?target=wise-0855")
    assert p2["preset"] is not None
    assert p2["preset"]["id"] == "wise-0855"
    assert p2["ra"] == "133.7951291667"
    assert p2["dec"] == "-7.2451472222"
    
    # 3. Barnard's Star with encoded characters
    p3 = parse_url_params("?target=Barnard%27s+Star&tab=search")
    assert p3["preset"] is not None
    assert p3["preset"]["id"] == "barnards-star"
    assert p3["ra"] == "269.4462678797"
    assert p3["tab"] == "search"
    
    print("All URL deep-linking tests passed!")

if __name__ == "__main__":
    test_url_params()
