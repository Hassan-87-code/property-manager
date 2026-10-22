from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("Testing Property Management API endpoints...")

    # 1. Health
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("✓ /api/health passed")

    # 2. Dashboard
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 200, f"Dashboard failed: {r.text}"
    stats = r.json()
    assert stats["total_properties"] > 0
    assert stats["total_units"] > 0
    assert stats["total_tenants"] > 0
    print(f"✓ /api/dashboard/stats passed: {stats['total_properties']} props, {stats['total_units']} units, occupancy: {stats['occupancy_rate']}%")

    # 3. Properties
    r = client.get("/api/properties")
    assert r.status_code == 200
    props = r.json()
    assert len(props) > 0
    print(f"✓ /api/properties passed: found {len(props)} properties")

    # 4. Units
    r = client.get("/api/units")
    assert r.status_code == 200
    units = r.json()
    assert len(units) > 0
    print(f"✓ /api/units passed: found {len(units)} units")

    # 5. Tenants
    r = client.get("/api/tenants")
    assert r.status_code == 200
    tenants = r.json()
    assert len(tenants) > 0
    print(f"✓ /api/tenants passed: found {len(tenants)} tenants")

    # 6. Rents
    r = client.get("/api/rents")
    assert r.status_code == 200
    rents = r.json()
    assert len(rents) > 0
    print(f"✓ /api/rents passed: found {len(rents)} rent invoices")

    # 7. Expenses
    r = client.get("/api/expenses")
    assert r.status_code == 200
    expenses = r.json()
    assert len(expenses) > 0
    print(f"✓ /api/expenses passed: found {len(expenses)} logged expenses")

    # 8. Workers
    r = client.get("/api/workers")
    assert r.status_code == 200
    workers = r.json()
    assert len(workers) > 0
    print(f"✓ /api/workers passed: found {len(workers)} contractors/workers")

    # 9. Work Orders
    r = client.get("/api/work-orders")
    assert r.status_code == 200
    wos = r.json()
    assert len(wos) > 0
    print(f"✓ /api/work-orders passed: found {len(wos)} work orders")

    # 10. Test Work Order -> Expense conversion
    first_wo = wos[0]
    r = client.post(f"/api/work-orders/{first_wo['id']}/convert-to-expense")
    assert r.status_code == 200, f"Conversion failed: {r.text}"
    print(f"✓ Convert work order #{first_wo['id']} to expense passed: {r.json()['message']}")

    print("\nALL TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_tests()

