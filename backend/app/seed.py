from datetime import date, datetime, timedelta
from .database import SessionLocal, Base, engine
from .models import Property, Unit, Tenant, RentPayment, Expense, Worker, WorkOrder

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(Property).first():
        print("Database already contains data. Skipping initial seeding.")
        db.close()
        return

    print("Seeding database with sample property management data...")

    # 1. Create Properties
    prop1 = Property(
        name="Grandview Heights Apartments",
        address="1042 Skyline Blvd",
        city="Denver",
        state="CO",
        zip_code="80202",
        property_type="Residential Multi-Family",
        total_units=6,
        description="Modern 6-unit apartment complex with downtown views and secure parking."
    )
    prop2 = Property(
        name="Oakwood Courtyard Townhomes",
        address="415 Meadowood Drive",
        city="Boulder",
        state="CO",
        zip_code="80301",
        property_type="Residential Multi-Family",
        total_units=4,
        description="Luxury 4-unit suburban townhomes with private garages and small yards."
    )
    prop3 = Property(
        name="Highland Park Duplex",
        address="782 Pearl Street",
        city="Fort Collins",
        state="CO",
        zip_code="80521",
        property_type="Duplex",
        total_units=2,
        description="Charming restored brick duplex near university campus and public transit."
    )
    towba_total_units = 165
    towba_occupied_units = int(towba_total_units * 0.8)
    prop4 = Property(
        name="TOWBA HEIGHT",
        address="south b zanzibar road",
        city="nairobi",
        state="NAIROBI",
        zip_code="0100",
        property_type="Residential Multi-Family",
        total_units=towba_total_units,
        description="WELCOME TO TOWBA 1,2,3 APARTMENT"
    )

    db.add_all([prop1, prop2, prop3, prop4])
    db.commit()

    # 2. Create Units
    units = [
        # Grandview Heights (6 units)
        Unit(property_id=prop1.id, unit_number="101", bedrooms=1, bathrooms=1.0, square_feet=680, rent_amount=65000.0, deposit_amount=65000.0, status="occupied"),
        Unit(property_id=prop1.id, unit_number="102", bedrooms=1, bathrooms=1.0, square_feet=700, rent_amount=65000.0, deposit_amount=65000.0, status="occupied"),
        Unit(property_id=prop1.id, unit_number="201", bedrooms=2, bathrooms=2.0, square_feet=950, rent_amount=67000.0, deposit_amount=67000.0, status="occupied"),
        Unit(property_id=prop1.id, unit_number="202", bedrooms=2, bathrooms=2.0, square_feet=980, rent_amount=67000.0, deposit_amount=67000.0, status="occupied"),
        Unit(property_id=prop1.id, unit_number="301", bedrooms=3, bathrooms=2.5, square_feet=1350, rent_amount=67000.0, deposit_amount=67000.0, status="vacant"),
        Unit(property_id=prop1.id, unit_number="302", bedrooms=2, bathrooms=1.5, square_feet=910, rent_amount=65000.0, deposit_amount=65000.0, status="maintenance"),

        # Oakwood Courtyard (4 units)
        Unit(property_id=prop2.id, unit_number="A1", bedrooms=2, bathrooms=2.0, square_feet=1150, rent_amount=66000.0, deposit_amount=66000.0, status="occupied"),
        Unit(property_id=prop2.id, unit_number="A2", bedrooms=2, bathrooms=2.0, square_feet=1150, rent_amount=66000.0, deposit_amount=66000.0, status="occupied"),
        Unit(property_id=prop2.id, unit_number="B1", bedrooms=3, bathrooms=2.5, square_feet=1480, rent_amount=67000.0, deposit_amount=67000.0, status="occupied"),
        Unit(property_id=prop2.id, unit_number="B2", bedrooms=3, bathrooms=2.5, square_feet=1480, rent_amount=67000.0, deposit_amount=67000.0, status="vacant"),

        # Highland Park Duplex (2 units)
        Unit(property_id=prop3.id, unit_number="Unit 1", bedrooms=2, bathrooms=1.0, square_feet=850, rent_amount=65000.0, deposit_amount=65000.0, status="occupied"),
        Unit(property_id=prop3.id, unit_number="Unit 2", bedrooms=2, bathrooms=1.0, square_feet=850, rent_amount=65000.0, deposit_amount=65000.0, status="occupied"),
    ]
    units.extend(
        Unit(
            property_id=prop4.id,
            unit_number=f"A{unit_index // 55 + 1}-{unit_index % 55 + 1:03}",
            bedrooms=3,
            bathrooms=2.0,
            square_feet=750,
            rent_amount=65000.0 + (unit_index % 3) * 1000,
            deposit_amount=0.0,
            status="occupied" if unit_index < towba_occupied_units else "vacant",
        )
        for unit_index in range(towba_total_units)
    )
    db.add_all(units)
    db.commit()

    # 3. Create Workers / Contractors
    w1 = Worker(
        name="Marcus Vance",
        specialty="Plumbing",
        phone="(303) 555-0192",
        email="marcus@vanceplumbing.com",
        hourly_rate=75.0,
        company_name="Vance & Sons Plumbing",
        status="available",
        notes="Master plumber with 14 years experience. Great on emergency leaks."
    )
    w2 = Worker(
        name="Elena Rostova",
        specialty="Electrical",
        phone="(303) 555-0248",
        email="elena@rostovaelectric.com",
        hourly_rate=85.0,
        company_name="Apex Electrical Solutions",
        status="available",
        notes="Licensed electrician. Reliable for panel upgrades and fixture replacements."
    )
    w3 = Worker(
        name="Carlos Gomez",
        specialty="HVAC",
        phone="(720) 555-0319",
        email="carlos@airpromech.com",
        hourly_rate=90.0,
        company_name="AirPro Heating & Air",
        status="busy",
        notes="Expert in central heating, AC mini-splits, and seasonal inspections."
    )
    w4 = Worker(
        name="David Miller",
        specialty="General Maintenance",
        phone="(303) 555-0481",
        email="miller.handyman@gmail.com",
        hourly_rate=50.0,
        company_name="Miller Property Works",
        status="available",
        notes="Handyman: drywall patching, painting, lock replacement, door repairs."
    )
    w5 = Worker(
        name="Sofia Chen",
        specialty="Cleaning & Turnover",
        phone="(720) 555-0567",
        email="sofia@sparklecleanllc.com",
        hourly_rate=40.0,
        company_name="Sparkle Clean Services",
        status="available",
        notes="Deep move-in / move-out cleanings and carpet steam cleaning."
    )

    db.add_all([w1, w2, w3, w4, w5])
    db.commit()

    # 4. Create Tenants
    today = date.today()
    tenants = [
        Tenant(
            unit_id=units[0].id, # 101
            first_name="Sarah",
            last_name="Jenkins",
            email="sarah.jenkins@gmail.com",
            phone="(303) 712-4491",
            emergency_contact="Mark Jenkins (Brother) - 303-712-8820",
            lease_start=date(2025, 6, 1),
            lease_end=date(2026, 5, 31),
            rent_amount=65000.0,
            deposit_paid=65000.0,
            status="active",
            notes="Works remotely in tech. Has one small registered service cat."
        ),
        Tenant(
            unit_id=units[1].id, # 102
            first_name="Alexander",
            last_name="Wright",
            email="a.wright@outlook.com",
            phone="(720) 419-8832",
            emergency_contact="Laura Wright (Mother) - 720-419-1100",
            lease_start=date(2025, 8, 1),
            lease_end=date(2026, 7, 31),
            rent_amount=65000.0,
            deposit_paid=65000.0,
            status="active",
            notes="Always pays rent on the 1st via bank transfer."
        ),
        Tenant(
            unit_id=units[2].id, # 201
            first_name="Emily & Noah",
            last_name="Carter",
            email="carter.family@gmail.com",
            phone="(303) 902-6178",
            emergency_contact="Robert Carter - 303-902-9999",
            lease_start=date(2025, 4, 1),
            lease_end=date(2026, 3, 31),
            rent_amount=67000.0,
            deposit_paid=67000.0,
            status="active",
            notes="Requested extra parking pass."
        ),
        Tenant(
            unit_id=units[3].id, # 202
            first_name="Michael",
            last_name="Chang",
            email="mchang.design@gmail.com",
            phone="(720) 844-1290",
            emergency_contact="Linda Chang - 720-844-0012",
            lease_start=date(2025, 11, 1),
            lease_end=date(2026, 10, 31),
            rent_amount=67000.0,
            deposit_paid=67000.0,
            status="active",
            notes="Graphic designer. Quiet tenant."
        ),
        Tenant(
            unit_id=units[6].id, # A1
            first_name="Rachel",
            last_name="Greenberg",
            email="rachel.g@colorado.edu",
            phone="(303) 633-8172",
            emergency_contact="Dan Greenberg - 303-633-9000",
            lease_start=date(2025, 2, 1),
            lease_end=date(2026, 1, 31),
            rent_amount=66000.0,
            deposit_paid=66000.0,
            status="active",
            notes="University faculty researcher."
        ),
        Tenant(
            unit_id=units[7].id, # A2
            first_name="James",
            last_name="Wilson",
            email="jwilson77@proton.me",
            phone="(720) 299-4410",
            emergency_contact="Diane Wilson - 720-299-4411",
            lease_start=date(2025, 9, 1),
            lease_end=date(2026, 8, 31),
            rent_amount=66000.0,
            deposit_paid=66000.0,
            status="active",
            notes="Renewed lease for second consecutive year."
        ),
        Tenant(
            unit_id=units[8].id, # B1
            first_name="Daniel & Chloe",
            last_name="Foster",
            email="dfoster@gmail.com",
            phone="(303) 512-9941",
            emergency_contact="Thomas Foster - 303-512-8877",
            lease_start=date(2025, 5, 1),
            lease_end=date(2026, 4, 30),
            rent_amount=67000.0,
            deposit_paid=67000.0,
            status="active",
            notes="Family with 1 child. Excellent tenants."
        ),
        Tenant(
            unit_id=units[10].id, # Duplex 1
            first_name="Brian",
            last_name="Sullivan",
            email="bsullivan@gmail.com",
            phone="(970) 310-8271",
            emergency_contact="Kelly Sullivan - 970-310-8800",
            lease_start=date(2025, 7, 1),
            lease_end=date(2026, 6, 30),
            rent_amount=65000.0,
            deposit_paid=65000.0,
            status="active",
            notes="Grad student in environmental sciences."
        ),
        Tenant(
            unit_id=units[11].id, # Duplex 2
            first_name="Hannah",
            last_name="Torres",
            email="htorres@creative.co",
            phone="(970) 441-2983",
            emergency_contact="Gloria Torres - 970-441-1122",
            lease_start=date(2025, 3, 1),
            lease_end=date(2026, 2, 28),
            rent_amount=65000.0,
            deposit_paid=65000.0,
            status="active",
            notes="Freelance photographer."
        )
    ]
    db.add_all(tenants)
    db.commit()

    # 5. Create Rent Payments (Recent history)
    current_month_first = today.replace(day=1)
    last_month_first = (current_month_first - timedelta(days=15)).replace(day=1)
    two_months_ago = (last_month_first - timedelta(days=15)).replace(day=1)

    rent_payments = [
        # Current month payments
        RentPayment(
            tenant_id=tenants[0].id,
            unit_id=units[0].id,
            amount_due=tenants[0].rent_amount,
            amount_paid=tenants[0].rent_amount,
            due_date=current_month_first,
            payment_date=current_month_first + timedelta(days=2),
            payment_method="Bank Transfer",
            status="paid",
            reference_number="ACH-889123",
            notes="Paid in full via ACH."
        ),
        RentPayment(
            tenant_id=tenants[1].id,
            unit_id=units[1].id,
            amount_due=tenants[1].rent_amount,
            amount_paid=tenants[1].rent_amount,
            due_date=current_month_first,
            payment_date=current_month_first,
            payment_method="Bank Transfer",
            status="paid",
            reference_number="ACH-994101",
            notes="Automated autopay."
        ),
        RentPayment(
            tenant_id=tenants[2].id,
            unit_id=units[2].id,
            amount_due=tenants[2].rent_amount,
            amount_paid=tenants[2].rent_amount,
            due_date=current_month_first,
            payment_date=current_month_first + timedelta(days=1),
            payment_method="Credit Card",
            status="paid",
            reference_number="CC-551029",
            notes="Tenant paid via online portal."
        ),
        RentPayment(
            tenant_id=tenants[3].id,
            unit_id=units[3].id,
            amount_due=tenants[3].rent_amount,
            amount_paid=tenants[3].rent_amount / 2,
            due_date=current_month_first,
            payment_date=current_month_first + timedelta(days=4),
            payment_method="Zelle",
            status="partial",
            reference_number="ZEL-44021",
            notes="Split payment agreed with landlord. Remaining KSh 33,500 due by 20th."
        ),
        RentPayment(
            tenant_id=tenants[4].id,
            unit_id=units[6].id,
            amount_due=tenants[4].rent_amount,
            amount_paid=tenants[4].rent_amount,
            due_date=current_month_first,
            payment_date=current_month_first,
            payment_method="Bank Transfer",
            status="paid",
            reference_number="ACH-118274",
            notes="Received on time."
        ),
        RentPayment(
            tenant_id=tenants[5].id,
            unit_id=units[7].id,
            amount_due=tenants[5].rent_amount,
            amount_paid=0.0,
            due_date=current_month_first,
            payment_date=None,
            payment_method="Bank Transfer",
            status="overdue" if today.day > 5 else "pending",
            reference_number=None,
            notes="Reminder notice sent on the 5th."
        ),
        RentPayment(
            tenant_id=tenants[6].id,
            unit_id=units[8].id,
            amount_due=tenants[6].rent_amount,
            amount_paid=tenants[6].rent_amount,
            due_date=current_month_first,
            payment_date=current_month_first + timedelta(days=1),
            payment_method="Check",
            status="paid",
            reference_number="CHK-1092",
            notes="Deposited at branch."
        ),
        RentPayment(
            tenant_id=tenants[7].id,
            unit_id=units[10].id,
            amount_due=tenants[7].rent_amount,
            amount_paid=tenants[7].rent_amount,
            due_date=current_month_first,
            payment_date=current_month_first + timedelta(days=3),
            payment_method="Bank Transfer",
            status="paid",
            reference_number="ACH-77291",
            notes="Paid in full."
        ),
        RentPayment(
            tenant_id=tenants[8].id,
            unit_id=units[11].id,
            amount_due=tenants[8].rent_amount,
            amount_paid=tenants[8].rent_amount,
            due_date=current_month_first,
            payment_date=current_month_first + timedelta(days=2),
            payment_method="Zelle",
            status="paid",
            reference_number="ZEL-99031",
            notes="Payment confirmed."
        ),
        # Prior month payments for trend history
        RentPayment(
            tenant_id=tenants[0].id,
            unit_id=units[0].id,
            amount_due=tenants[0].rent_amount,
            amount_paid=tenants[0].rent_amount,
            due_date=last_month_first,
            payment_date=last_month_first + timedelta(days=1),
            payment_method="Bank Transfer",
            status="paid",
            reference_number="ACH-87110"
        ),
        RentPayment(
            tenant_id=tenants[1].id,
            unit_id=units[1].id,
            amount_due=tenants[1].rent_amount,
            amount_paid=tenants[1].rent_amount,
            due_date=last_month_first,
            payment_date=last_month_first,
            payment_method="Bank Transfer",
            status="paid",
            reference_number="ACH-87111"
        ),
        RentPayment(
            tenant_id=tenants[2].id,
            unit_id=units[2].id,
            amount_due=tenants[2].rent_amount,
            amount_paid=tenants[2].rent_amount,
            due_date=last_month_first,
            payment_date=last_month_first + timedelta(days=2),
            payment_method="Credit Card",
            status="paid",
            reference_number="CC-55099"
        ),
        RentPayment(
            tenant_id=tenants[4].id,
            unit_id=units[6].id,
            amount_due=tenants[4].rent_amount,
            amount_paid=tenants[4].rent_amount,
            due_date=last_month_first,
            payment_date=last_month_first,
            payment_method="Bank Transfer",
            status="paid",
            reference_number="ACH-87115"
        ),
        RentPayment(
            tenant_id=tenants[6].id,
            unit_id=units[8].id,
            amount_due=tenants[6].rent_amount,
            amount_paid=tenants[6].rent_amount,
            due_date=last_month_first,
            payment_date=last_month_first + timedelta(days=1),
            payment_method="Check",
            status="paid",
            reference_number="CHK-1088"
        ),
    ]
    db.add_all(rent_payments)
    db.commit()

    # 6. Create Work Orders
    wo1 = WorkOrder(
        title="Kitchen Sink Faucet Leaking",
        description="Continuous slow dripping under the sink cabinet in unit 101. Potential valve gasket wear.",
        property_id=prop1.id,
        unit_id=units[0].id,
        worker_id=w1.id,
        priority="medium",
        status="completed",
        estimated_cost=150.0,
        actual_cost=165.0,
        hours_spent=2.0,
        reported_date=today - timedelta(days=8),
        completed_date=today - timedelta(days=6)
    )
    wo2 = WorkOrder(
        title="HVAC Filter Replacement & Spring Inspection",
        description="Routine seasonal filter replacement and compressor diagnostics across units 201 and 202.",
        property_id=prop1.id,
        unit_id=units[2].id,
        worker_id=w3.id,
        priority="low",
        status="in_progress",
        estimated_cost=280.0,
        actual_cost=0.0,
        hours_spent=1.5,
        reported_date=today - timedelta(days=3),
        completed_date=None
    )
    wo3 = WorkOrder(
        title="Water Heater Pilot Light Failure",
        description="No hot water in Unit A1. Thermocouple or gas control valve needs inspection urgently.",
        property_id=prop2.id,
        unit_id=units[6].id,
        worker_id=w1.id,
        priority="emergency",
        status="assigned",
        estimated_cost=320.0,
        actual_cost=0.0,
        hours_spent=0.0,
        reported_date=today - timedelta(days=1),
        completed_date=None
    )
    wo4 = WorkOrder(
        title="Balcony Door Latch Stuck",
        description="Sliding glass door latch won't lock from the inside. Security concern for tenant.",
        property_id=prop2.id,
        unit_id=units[8].id,
        worker_id=w4.id,
        priority="high",
        status="completed",
        estimated_cost=110.0,
        actual_cost=95.0,
        hours_spent=1.5,
        reported_date=today - timedelta(days=12),
        completed_date=today - timedelta(days=10)
    )
    wo5 = WorkOrder(
        title="Unit 302 Paint & Drywall Turnover",
        description="Full repaint of living room and primary bedroom, fill nail holes and touch up trim before new tenant.",
        property_id=prop1.id,
        unit_id=units[5].id,
        worker_id=w4.id,
        priority="medium",
        status="in_progress",
        estimated_cost=650.0,
        actual_cost=0.0,
        hours_spent=4.0,
        reported_date=today - timedelta(days=5),
        completed_date=None
    )
    wo6 = WorkOrder(
        title="Exterior Motion Sensor Light Flickering",
        description="West staircase motion floodlight flickers intermittently at night.",
        property_id=prop3.id,
        unit_id=None,
        worker_id=w2.id,
        priority="low",
        status="reported",
        estimated_cost=120.0,
        actual_cost=0.0,
        hours_spent=0.0,
        reported_date=today - timedelta(days=2),
        completed_date=None
    )

    db.add_all([wo1, wo2, wo3, wo4, wo5, wo6])
    db.commit()

    # 7. Create Expenses
    expenses = [
        Expense(
            property_id=prop1.id,
            unit_id=units[0].id,
            worker_id=w1.id,
            category="Repairs & Maintenance",
            amount=165.0,
            expense_date=today - timedelta(days=6),
            payee_vendor="Vance & Sons Plumbing",
            payment_method="Bank Transfer",
            status="paid",
            receipt_ref="INV-7819",
            notes="Faucet gasket repair for unit 101."
        ),
        Expense(
            property_id=prop2.id,
            unit_id=units[8].id,
            worker_id=w4.id,
            category="Repairs & Maintenance",
            amount=95.0,
            expense_date=today - timedelta(days=10),
            payee_vendor="Miller Property Works",
            payment_method="Credit Card",
            status="paid",
            receipt_ref="INV-3321",
            notes="Balcony door lock replacement."
        ),
        Expense(
            property_id=prop1.id,
            unit_id=None,
            worker_id=None,
            category="Utilities",
            amount=420.50,
            expense_date=today - timedelta(days=5),
            payee_vendor="Xcel Energy",
            payment_method="Bank Transfer",
            status="paid",
            receipt_ref="XCEL-9920",
            notes="Common area electricity, hallway lighting & exterior grounds."
        ),
        Expense(
            property_id=prop1.id,
            unit_id=None,
            worker_id=None,
            category="Utilities",
            amount=215.30,
            expense_date=today - timedelta(days=7),
            payee_vendor="Denver Water Department",
            payment_method="Bank Transfer",
            status="paid",
            receipt_ref="DW-55410",
            notes="Water & sewer bill for Grandview building."
        ),
        Expense(
            property_id=prop2.id,
            unit_id=None,
            worker_id=None,
            category="Property Taxes",
            amount=1250.0,
            expense_date=today - timedelta(days=15),
            payee_vendor="Boulder County Treasurer",
            payment_method="Bank Transfer",
            status="paid",
            receipt_ref="TX-2026-Q1",
            notes="Quarterly municipal property tax assessment."
        ),
        Expense(
            property_id=prop1.id,
            unit_id=None,
            worker_id=None,
            category="Insurance",
            amount=680.0,
            expense_date=today - timedelta(days=18),
            payee_vendor="Travelers Commercial Insurance",
            payment_method="Credit Card",
            status="paid",
            receipt_ref="POL-883192",
            notes="Monthly building hazard & liability insurance premium."
        ),
        Expense(
            property_id=prop3.id,
            unit_id=None,
            worker_id=None,
            category="Supplies",
            amount=142.80,
            expense_date=today - timedelta(days=4),
            payee_vendor="The Home Depot",
            payment_method="Credit Card",
            status="paid",
            receipt_ref="HD-99412",
            notes="Smoke detector batteries, HVAC filters, and LED bulb packs."
        ),
        Expense(
            property_id=prop2.id,
            unit_id=None,
            worker_id=None,
            category="Contractor Wages",
            amount=350.0,
            expense_date=today - timedelta(days=12),
            payee_vendor="GreenThumb Landscaping",
            payment_method="Bank Transfer",
            status="paid",
            receipt_ref="GT-8812",
            notes="Bi-weekly lawn mowing, tree trimming, and sprinkler check."
        ),
        # Prior month expense
        Expense(
            property_id=prop1.id,
            unit_id=None,
            worker_id=None,
            category="Utilities",
            amount=395.0,
            expense_date=last_month_first + timedelta(days=5),
            payee_vendor="Xcel Energy",
            payment_method="Bank Transfer",
            status="paid",
            receipt_ref="XCEL-9812",
            notes="Common area utilities for last month."
        ),
        Expense(
            property_id=prop2.id,
            unit_id=None,
            worker_id=None,
            category="Insurance",
            amount=550.0,
            expense_date=last_month_first + timedelta(days=12),
            payee_vendor="State Farm Commercial",
            payment_method="Credit Card",
            status="paid",
            receipt_ref="SF-44910",
            notes="Monthly insurance premium."
        )
    ]
    db.add_all(expenses)
    db.commit()

    print("Sample database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
