# Seeds DEMO accounts and orders so you can click through the whole flow:
#   supplier confirms -> carrier accepts -> pickup -> delivery with the 4-digit code.
# It writes real rows to the Supabase project in .env.local, so it refuses to run unless SEED_OK=1.
#
#   SEED_OK=1 python -I scripts/seed_demo.py            create (or recreate) the demo data
#   SEED_OK=1 python -I scripts/seed_demo.py cleanup    delete every demo account, its orders and queued SMS
#
# Everything uses demo-*@bigcuts.test emails and +25471300000x phone numbers, so it is easy to find and
# no real person is ever texted. Passwords are random and written to .seed-accounts.txt (git-ignored).
import os, sys, re, json, secrets, datetime, urllib.request, urllib.error

if os.environ.get("SEED_OK") != "1":
    sys.exit("Refusing to run: this writes to the Supabase project in .env.local. Set SEED_OK=1 to confirm.")

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ENV = {}
for line in open(os.path.join(ROOT, ".env.local"), encoding="utf-8"):
    m = re.match(r"([A-Z_]+)=(.*)", line.strip())
    if m:
        ENV[m.group(1)] = m.group(2)
URL, ANON, SVC = ENV["NEXT_PUBLIC_SUPABASE_URL"], ENV["NEXT_PUBLIC_SUPABASE_ANON_KEY"], ENV["SUPABASE_SERVICE_ROLE_KEY"]
PW = secrets.token_urlsafe(9) + "-9aZ"
DOMAIN = "bigcuts.test"


def http(method, path, body=None, token=None, key=ANON, extra=None):
    h = {"apikey": key, "Authorization": "Bearer " + (token or key), "Content-Type": "application/json"}
    h.update(extra or {})
    req = urllib.request.Request(URL + path, method=method, headers=h, data=json.dumps(body).encode() if body is not None else None)
    try:
        r = urllib.request.urlopen(req)
        raw = r.read()
        return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw.decode(errors="replace")


def svc(method, path, body=None, extra=None):
    return http(method, path, body, key=SVC, extra=extra)


def err(res):
    s, b = res
    return b.get("message", str(b)) if isinstance(b, dict) else str(b)


class User:
    def __init__(self, key, role, name, phone, **meta):
        self.key, self.email = key, f"demo-{key}@{DOMAIN}"
        self.meta = {"role": role, "full_name": name, "phone": phone, **meta}
        self.id = self.token = None

    def create(self):
        s, b = svc("POST", "/auth/v1/admin/users", {"email": self.email, "password": PW, "email_confirm": True, "user_metadata": self.meta})
        if s >= 300:
            sys.exit(f"could not create {self.email}: {s} {b}")
        self.id = b["id"]
        s, b = http("POST", "/auth/v1/token?grant_type=password", {"email": self.email, "password": PW})
        self.token = b["access_token"]

    def rpc(self, fn, args=None):
        return http("POST", "/rest/v1/rpc/" + fn, args or {}, token=self.token)

    def patch(self, path, body):
        return http("PATCH", "/rest/v1/" + path, body, token=self.token, extra={"Prefer": "return=representation"})


def cleanup():
    s, b = svc("GET", "/auth/v1/admin/users?per_page=200")
    n = 0
    for u in (b.get("users", []) if isinstance(b, dict) else []):
        if (u.get("email") or "").startswith("demo-") and (u.get("email") or "").endswith("@" + DOMAIN):
            svc("DELETE", "/auth/v1/admin/users/" + u["id"])
            n += 1
    svc("DELETE", "/rest/v1/sms_outbox?to_phone=like.%2B25471300000*")
    print(f"cleanup: deleted {n} demo users and their queued SMS")


def step(label, res, ok_when=lambda s: s < 300):
    s, b = res
    print(("  ok   " if ok_when(s) else "  FAIL ") + label + ("" if ok_when(s) else " | " + err(res)))
    return ok_when(s), b


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "cleanup":
        return cleanup()
    cleanup()  # start clean so a rerun never piles up duplicates

    exp = (datetime.date.today() + datetime.timedelta(days=365)).isoformat()
    sup = User("supplier", "supplier", "Demo Slaughterhouse", "0713000001", business_name="BIG Demo Slaughterhouse", supplier_type="slaughterhouse")
    bch = User("butchery", "retailer", "Demo Butchery", "0713000002", business_name="BIG Demo Butchery")
    car = User("carrier", "rider", "Demo Carrier", "0713000003", meat_permit_no="DEMO-MTP-1001", meat_permit_expiry=exp, vehicle_reg="kdd 100d", load_capacity_kg="300")
    adm = User("admin", "retailer", "Demo Admin", "0713000004")
    print("Creating demo accounts")
    for u in (sup, bch, car, adm):
        u.create()
    svc("PATCH", "/rest/v1/profiles?id=eq." + adm.id, {"role": "admin"})  # only the service role may change a role

    loc = {sup: (-1.2800, 36.8000), bch: (-1.2921, 36.8219), car: (-1.2850, 36.8050)}
    for u, (la, ln) in loc.items():
        step(f"location for {u.key}", u.patch("profiles?id=eq." + u.id, {"lat": la, "lng": ln, "service_radius_km": 25, "address": "Nairobi (demo)"}))
    step("admin checks the carrier's permit", adm.rpc("admin_set_carrier_verified", {"p_carrier_id": car.id, "p_verified": True}))

    # Supplier listings (demo prices per kg).
    s, prods = svc("GET", "/rest/v1/products?select=id,name")
    pid = {p["name"]: p["id"] for p in prods}
    stock = {  # name: (price/kg, qty, min order)
        "Beef (boneless)": (700, 300, 5), "Beef (with bone)": (620, 300, 5), "Beef mince": (760, 120, 3),
        "Rib eye": (1150, 60, 2), "T-bone steak": (1050, 60, 2), "Sirloin steak": (980, 60, 2),
        "Beef steak (fillet)": (1450, 40, 2), "Ox tail": (720, 50, 2), "Beef short ribs": (820, 50, 2), "Goat meat": (880, 80, 3),
    }
    print("Supplier listings")
    listing = {}
    for name, (price, qty, mn) in stock.items():
        ok, b = step(name, http("POST", "/rest/v1/supplier_listings",
                                {"supplier_id": sup.id, "product_id": pid[name], "price_per_unit": price, "available_qty": qty, "min_order_qty": mn},
                                token=sup.token, extra={"Prefer": "return=representation"}))
        if ok:
            listing[name] = b[0]["id"]

    def place(items, note):
        ok, oid = step(f"place order {note}", bch.rpc("place_order", {"p_supplier_id": sup.id, "p_items": [{"listing_id": listing[n], "quantity": q} for n, q in items], "p_notes": note}))
        return oid if ok else None

    print("Order A: placed, confirmed, collected and delivered (shows in history)")
    a = place([("Beef (boneless)", 20), ("Rib eye", 5)], "Demo order A (delivered)")
    run = None
    if a:
        ok, run = step("supplier confirms", sup.rpc("supplier_respond", {"p_order_id": a, "p_accept": True}))
        s, rd = sup.rpc("supplier_respond", {}) if False else svc("GET", "/rest/v1/delivery_runs?select=run_date&id=eq." + str(run))
        car.rpc("set_rider_availability", {"p_date": rd[0]["run_date"], "p_available": True})
        step("carrier accepts the run", car.rpc("accept_run", {"p_run_id": run}))
        step("carrier collects with a certificate number", car.rpc("mark_run_picked_up", {"p_run_id": run, "p_transport_cert_no": "DEMO-COT-0001"}))
        s, sec = svc("GET", "/rest/v1/order_secrets?select=delivery_code&order_id=eq." + str(a))
        step("delivery confirmed with the customer's code", car.rpc("confirm_delivery", {"p_order_id": a, "p_code": sec[0]["delivery_code"], "p_method": "cash"}))

    print("Order B: placed, waiting for the supplier to confirm")
    place([("Beef mince", 10), ("Ox tail", 8)], "Demo order B (waiting for supplier)")

    print("Order C: placed and confirmed, waiting for a carrier to accept")
    c = place([("T-bone steak", 6), ("Sirloin steak", 6)], "Demo order C (waiting for carrier)")
    if c:
        step("supplier confirms", sup.rpc("supplier_respond", {"p_order_id": c, "p_accept": True}))

    lines = [f"BIG Premium Cuts demo accounts (created {datetime.datetime.now().isoformat(timespec='seconds')})", f"Password for all four: {PW}", ""]
    for u, what in ((sup, "supplier  (confirm orders, edit listings)"), (bch, "butchery  (place and track orders)"), (car, "carrier   (accept runs, deliver with the code)"), (adm, "admin     (check carrier permits)")):
        lines.append(f"{u.email:34} {what}")
    lines += ["", "Remove everything: SEED_OK=1 python -I scripts/seed_demo.py cleanup"]
    open(os.path.join(ROOT, ".seed-accounts.txt"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print("\n" + "\n".join(lines))


main()
