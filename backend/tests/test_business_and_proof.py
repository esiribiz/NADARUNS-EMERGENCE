"""Iteration 4 tests: POST /orders/{id}/proof + business endpoints."""
import os
import requests
import pytest

BASE = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://delivery-ui-kit-3.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE}/api"

# Tiny 1x1 PNG base64 data URL
SAMPLE_DATA_URL = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4"
    "nGNgAAIAAAUAAarVyFEAAAAASUVORK5CYII="
)


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ============ Photo Proof Upload ============
class TestProofUpload:
    def test_upload_proof_persists_on_order(self, s):
        # ensure a pending order, then take its id
        s.post(f"{API}/orders/seed-new-pending")
        oid = s.get(f"{API}/orders/pending").json()["id"]

        r = s.post(f"{API}/orders/{oid}/proof", json={"proof_photo": SAMPLE_DATA_URL})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["id"] == oid
        assert body["proof_photo"] == SAMPLE_DATA_URL

    def test_upload_proof_nonexistent_returns_404(self, s):
        r = s.post(f"{API}/orders/nonexistent-xyz/proof",
                   json={"proof_photo": SAMPLE_DATA_URL})
        assert r.status_code == 404


# ============ Business profile ============
class TestBusinessMe:
    def test_get_business_returns_nordic_bowl(self, s):
        r = s.get(f"{API}/business/me", timeout=15)
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["id"] == "business-001"
        assert b["name"] == "Nordic Bowl AB"
        assert b["email"]
        assert b["phone"]
        assert isinstance(b["total_shipments"], int)
        assert b["total_shipments"] >= 0
        assert "_id" not in b


# ============ Business Shipments CRUD ============
class TestBusinessShipments:
    def test_list_shipments_returns_list(self, s):
        r = s.get(f"{API}/business/shipments")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        for o in items:
            assert o.get("business_id") == "business-001"
            assert "_id" not in o

    def test_create_standard_shipment(self, s):
        payload = {
            "pickup_name": "TEST_Pickup Cafe",
            "pickup_address": "1 TEST Pickup St",
            "pickup_lat": 59.3326,
            "pickup_lng": 18.0649,
            "dropoff_name": "TEST_Drop Apt",
            "dropoff_address": "2 TEST Drop St",
            "dropoff_lat": 59.3420,
            "dropoff_lng": 18.0610,
            "customer_name": "TEST_Customer",
            "customer_phone": "+46 70 000 0000",
            "customer_apartment": "Apt 1",
            "customer_notes": "TEST note",
            "items": [{"name": "Bowl", "quantity": 2}],
            "priority": "standard",
        }
        r = s.post(f"{API}/business/shipments", json=payload)
        assert r.status_code == 200, r.text
        o = r.json()
        assert o["status"] == "pending"
        assert o["business_id"] == "business-001"
        assert o["distance_km"] > 0
        assert o["eta_minutes"] > 0
        assert o["earnings"] > 0
        assert o["customer"]["name"] == "TEST_Customer"
        assert o["pickup"]["name"] == "TEST_Pickup Cafe"
        assert len(o["items"]) == 1
        assert o["items"][0]["quantity"] == 2

        # Verify GET by id returns same
        g = s.get(f"{API}/business/shipments/{o['id']}")
        assert g.status_code == 200
        got = g.json()
        assert got["id"] == o["id"]
        assert got["business_id"] == "business-001"

        # And it appears in list
        lst = s.get(f"{API}/business/shipments").json()
        assert any(x["id"] == o["id"] for x in lst)

    def test_express_is_1_5x_of_standard(self, s):
        base_payload = {
            "pickup_name": "TEST_P",
            "pickup_address": "A",
            "pickup_lat": 59.33,
            "pickup_lng": 18.07,
            "dropoff_name": "TEST_D",
            "dropoff_address": "B",
            "dropoff_lat": 59.34,
            "dropoff_lng": 18.08,
            "customer_name": "TEST_C",
            "customer_phone": "+46 70 0",
            "items": [{"name": "Item", "quantity": 1}],
        }
        std = s.post(f"{API}/business/shipments",
                     json={**base_payload, "priority": "standard"}).json()
        exp = s.post(f"{API}/business/shipments",
                     json={**base_payload, "priority": "express"}).json()
        # Same distance -> earnings_express ≈ 1.5 * earnings_standard
        ratio = exp["earnings"] / std["earnings"]
        assert 1.45 <= ratio <= 1.55, f"ratio={ratio} std={std['earnings']} exp={exp['earnings']}"
        # express eta < standard eta (express adds 5 vs 10)
        assert exp["eta_minutes"] < std["eta_minutes"]

    def test_get_shipment_404(self, s):
        r = s.get(f"{API}/business/shipments/nonexistent-xyz")
        assert r.status_code == 404

    def test_business_total_shipments_reflects_count(self, s):
        # After we've created several above, total should be >= 3
        b = s.get(f"{API}/business/me").json()
        lst = s.get(f"{API}/business/shipments").json()
        assert b["total_shipments"] == len(lst)
