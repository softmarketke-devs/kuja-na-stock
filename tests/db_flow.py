# Live-database test. Creates throwaway kns-test-*@example.test users in whatever Supabase project
# .env.local points at, drives the full order flow as each role, then you delete them with `cleanup`.
# It writes real rows, so it refuses to run unless KNS_TEST_OK=1 is set.
#   KNS_TEST_OK=1 python -I tests/db_flow.py            (run from the repo root)
import os as _os, sys as _sys
if _os.environ.get("KNS_TEST_OK") != "1":
    _sys.exit("Refusing to run: this writes to the Supabase project in .env.local. Set KNS_TEST_OK=1 to confirm.")
_ENV_PATH = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", ".env.local")
import json, os, re, sys, urllib.request, urllib.error, datetime

ENV = {}
for line in open(_ENV_PATH, encoding="utf-8"):
    m = re.match(r"([A-Z_]+)=(.*)", line.strip())
    if m:
        ENV[m.group(1)] = m.group(2)
URL = ENV["NEXT_PUBLIC_SUPABASE_URL"]
ANON = ENV["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
SVC = ENV["SUPABASE_SERVICE_ROLE_KEY"]
PW = "KnsTest-Passw0rd!"
RESULTS = []


def http(method, path, body=None, token=None, key=ANON, extra=None):
    h = {"apikey": key, "Authorization": "Bearer " + (token or key), "Content-Type": "application/json"}
    h.update(extra or {})
    req = urllib.request.Request(URL + path, method=method, headers=h,
                                 data=json.dumps(body).encode() if body is not None else None)
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


def msg(res):
    s, b = res
    return b.get("message", str(b)) if isinstance(b, dict) else str(b)


def check(name, ok, detail=""):
    RESULTS.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + ((" | " + detail) if detail else ""))


def svc(method, path, body=None, extra=None):
    return http(method, path, body, key=SVC, extra=extra)


class U:
    def __init__(self, key, email, meta):
        self.key, self.email, self.meta = key, email, meta
        self.id = self.token = None

    def create(self):
        s, b = svc("POST", "/auth/v1/admin/users", {"email": self.email, "password": PW, "email_confirm": True,
                                                    "user_metadata": self.meta})
        if s >= 300:
            raise SystemExit(f"create {self.key} failed: {s} {b}")
        self.id = b["id"]
        s, b = http("POST", "/auth/v1/token?grant_type=password", {"email": self.email, "password": PW})
        self.token = b["access_token"]

    def rpc(self, fn, args=None):
        return http("POST", "/rest/v1/rpc/" + fn, args or {}, token=self.token)

    def get(self, path):
        return http("GET", "/rest/v1/" + path, token=self.token)

    def patch(self, path, body):
        return http("PATCH", "/rest/v1/" + path, body, token=self.token, extra={"Prefer": "return=representation"})


def mk(key, role, name, phone, **extra):
    meta = {"role": role, "full_name": name, "phone": phone}
    meta.update(extra)
    return U(key, f"kns-test-{key}@example.test", meta)


users = {
    "retA": mk("reta", "retailer", "Test Butchery A", "0712000001", business_name="Test Butchery A"),
    "retB": mk("retb", "retailer", "Test Butchery B", "0712000002", business_name="Test Butchery B"),
    "sup": mk("sup", "supplier", "Test Slaughterhouse", "0712000003", business_name="Test Slaughterhouse",
              supplier_type="slaughterhouse"),
    "carGood": mk("cargood", "rider", "Carrier Good", "0712000004", meat_permit_no="MTP-1001",
                  meat_permit_expiry="2027-06-30", vehicle_reg="kda 111a", load_capacity_kg="200"),
    "carGood2": mk("cargood2", "rider", "Carrier Good Two", "0712000005", meat_permit_no="MTP-1002",
                   meat_permit_expiry="2027-06-30", vehicle_reg="kda 222b", load_capacity_kg="200"),
    "carExpired": mk("carexp", "rider", "Carrier Expired", "0712000006", meat_permit_no="MTP-1003",
                     meat_permit_expiry="2026-10-01", vehicle_reg="kda 333c", load_capacity_kg="200"),
    "carSmall": mk("carsmall", "rider", "Carrier Small", "0712000007", meat_permit_no="MTP-1004",
                   meat_permit_expiry="2027-06-30", vehicle_reg="kda 444d", load_capacity_kg="5"),
    "admin": mk("admin", "retailer", "Test Admin", "0712000008"),
}
LOC = {  # a few km apart, central Nairobi
    "retA": (-1.2921, 36.8219), "retB": (-1.2750, 36.8100), "sup": (-1.2800, 36.8000),
    "carGood": (-1.2850, 36.8050), "carGood2": (-1.2860, 36.8060),
    "carExpired": (-1.2870, 36.8070), "carSmall": (-1.2880, 36.8080), "admin": (-1.2900, 36.8200),
}


def cleanup():
    s, b = svc("GET", "/auth/v1/admin/users?per_page=200")
    n = 0
    for u in (b.get("users", []) if isinstance(b, dict) else []):
        if (u.get("email") or "").startswith("kns-test-"):
            svc("DELETE", "/auth/v1/admin/users/" + u["id"])
            n += 1
    print(f"cleanup: deleted {n} test users")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "cleanup":
        return cleanup()
    cleanup()  # start clean

    # ---- 1. signup via trigger
    for u in users.values():
        u.create()
    s, prof = svc("GET", "/rest/v1/profiles?select=id,role,phone,vehicle_reg,is_verified,meat_permit_no&id=in.(" +
                  ",".join(u.id for u in users.values()) + ")")
    by = {p["id"]: p for p in prof}
    check("signup trigger creates profiles with right roles",
          by[users["sup"].id]["role"] == "supplier" and by[users["carGood"].id]["role"] == "rider"
          and by[users["retA"].id]["role"] == "retailer")
    check("phone normalised to +254 and vehicle upper-cased",
          by[users["retA"].id]["phone"] == "+254712000001" and by[users["carGood"].id]["vehicle_reg"] == "KDA 111A",
          f'{by[users["retA"].id]["phone"]}, {by[users["carGood"].id]["vehicle_reg"]}')
    check("new carriers start unchecked", all(not by[users[k].id]["is_verified"] for k in
                                                ("carGood", "carGood2", "carExpired", "carSmall")))
    # make admin (service role is allowed to change the role)
    svc("PATCH", "/rest/v1/profiles?id=eq." + users["admin"].id, {"role": "admin"})

    # locations
    for k, (la, ln) in LOC.items():
        s, b = users[k].patch("profiles?id=eq." + users[k].id, {"lat": la, "lng": ln, "service_radius_km": 20})
        if s >= 300:
            check(f"set location {k}", False, msg((s, b)))
    s, b = users["retA"].patch("profiles?id=eq." + users["retA"].id, {"role": "admin"})
    check("user cannot promote self to admin", s >= 300, msg((s, b)))
    s, b = users["carGood"].patch("profiles?id=eq." + users["carGood"].id, {"is_verified": True})
    check("carrier cannot verify self", s >= 300, msg((s, b)))

    # ---- 2. listing + quote + order
    s, prods = http("GET", "/rest/v1/products?select=id,name&name=eq.Beef%20(with%20bone)", token=users["sup"].token)
    pid = prods[0]["id"]
    s, b = users["sup"].patch("supplier_listings?id=eq.x", {}) if False else http(
        "POST", "/rest/v1/supplier_listings", {"supplier_id": users["sup"].id, "product_id": pid,
                                               "price_per_unit": 650, "available_qty": 100, "min_order_qty": 5},
        token=users["sup"].token, extra={"Prefer": "return=representation"})
    check("supplier can list a product", s < 300, msg((s, b)))
    listing = b[0]["id"] if s < 300 else None
    s, b = http("POST", "/rest/v1/supplier_listings", {"supplier_id": users["sup"].id, "product_id": pid,
                                                        "price_per_unit": 1, "available_qty": 1},
                token=users["retA"].token)
    check("retailer cannot create a supplier listing", s >= 300, msg((s, b)))

    s, q = users["retA"].rpc("quote_suppliers")
    qd = q[0] if isinstance(q, list) and q else None
    check("retailer sees supplier quote with distance and fee", bool(qd) and qd["in_range"],
          f'{qd["distance_km"]} km, fee {qd["delivery_fee"]}' if qd else msg((s, q)))

    s, o1 = users["retA"].rpc("place_order", {"p_supplier_id": users["sup"].id,
                                               "p_items": [{"listing_id": listing, "quantity": 20}],
                                               "p_notes": "thin cut please"})
    check("butchery A places 20 kg order", s < 300, str(o1)[:80])
    s, o2 = users["retB"].rpc("place_order", {"p_supplier_id": users["sup"].id,
                                               "p_items": [{"listing_id": listing, "quantity": 10}]})
    check("butchery B places 10 kg order", s < 300, str(o2)[:80])
    s, b = users["retA"].rpc("place_order", {"p_supplier_id": users["sup"].id,
                                              "p_items": [{"listing_id": listing, "quantity": 1}]})
    check("order below minimum is rejected", s >= 300, msg((s, b)))
    s, b = users["retA"].rpc("place_order", {"p_supplier_id": users["sup"].id,
                                              "p_items": [{"listing_id": listing, "quantity": 5000}]})
    check("order above stock is rejected", s >= 300, msg((s, b)))

    s, sec = users["retA"].get("order_secrets?select=delivery_code&order_id=eq." + str(o1))
    codeA = sec[0]["delivery_code"] if s < 300 and sec else None
    check("retailer can read own delivery code", bool(codeA) and len(codeA) == 4)
    s, sec2 = users["retB"].get("order_secrets?select=delivery_code&order_id=eq." + str(o1))
    check("other butchery cannot read that code", s < 300 and sec2 == [], str(sec2)[:60])
    s, ord2 = users["retB"].get("orders?select=id&id=eq." + str(o1))
    check("other butchery cannot read the order (RLS)", s < 300 and ord2 == [])
    s, sc = users["carGood"].get("order_secrets?select=delivery_code")
    check("carrier cannot read any delivery code", s < 300 and sc == [])

    # ---- 3. supplier confirms
    s, b = users["retA"].rpc("supplier_respond", {"p_order_id": o1, "p_accept": True})
    check("retailer cannot confirm an order", s >= 300, msg((s, b)))
    s, run = users["sup"].rpc("supplier_respond", {"p_order_id": o1, "p_accept": True})
    check("supplier confirms order A -> run created", s < 300 and run, str(run)[:60])
    s, run2 = users["sup"].rpc("supplier_respond", {"p_order_id": o2, "p_accept": True})
    check("order B joins the same run", s < 300 and run2 == run, f"{run2} vs {run}")
    s, l = users["sup"].get("supplier_listings?select=available_qty&id=eq." + listing)
    check("stock reserved (100 - 30 = 70)", float(l[0]["available_qty"]) == 70, str(l))

    # ---- 4. carrier eligibility
    s, rd = users["sup"].get("delivery_runs?select=run_date&id=eq." + str(run))
    rdate = rd[0]["run_date"]
    for k in ("carGood", "carGood2", "carExpired", "carSmall"):
        users[k].rpc("set_rider_availability", {"p_date": rdate, "p_available": True})
    s, orr = users["carGood"].rpc("open_runs_for_me")
    reason = orr[0]["blocked_reason"] if isinstance(orr, list) and orr else None
    check("unchecked carrier sees the run as blocked", bool(reason) and "checked" in reason, str(reason))
    s, b = users["carGood"].rpc("accept_run", {"p_run_id": run})
    check("unchecked carrier cannot accept", s >= 300, msg((s, b)))
    s, b = users["carGood"].rpc("admin_set_carrier_verified", {"p_carrier_id": users["carGood"].id, "p_verified": True})
    check("non-admin cannot call admin_set_carrier_verified", s >= 300, msg((s, b)))
    s, b = users["retA"].rpc("admin_set_carrier_verified", {"p_carrier_id": users["carGood"].id, "p_verified": True})
    check("butchery cannot call admin_set_carrier_verified", s >= 300, msg((s, b)))

    for k in ("carGood", "carGood2", "carExpired", "carSmall"):
        s, b = users["admin"].rpc("admin_set_carrier_verified", {"p_carrier_id": users[k].id, "p_verified": True})
        check(f"admin verifies {k}", s < 300, msg((s, b)) if s >= 300 else "")
    s, nt = svc("GET", "/rest/v1/notifications?select=type&user_id=eq." + users["carGood"].id + "&type=eq.carrier_verified")
    check("carrier is notified when verified", s < 300 and len(nt) == 1)
    s, sm = svc("GET", "/rest/v1/sms_outbox?select=message&user_id=eq." + users["carGood"].id)
    check("SMS queued for the carrier", s < 300 and any("checked" in m["message"] for m in sm), str(sm)[:70])
    s, b = users["admin"].rpc("admin_set_carrier_verified", {"p_carrier_id": users["retA"].id, "p_verified": True})
    check("admin cannot 'verify' a non-carrier", s >= 300, msg((s, b)))

    s, b = users["carExpired"].rpc("accept_run", {"p_run_id": run})
    check("expired permit cannot accept", s >= 300, msg((s, b)))
    s, b = users["carSmall"].rpc("accept_run", {"p_run_id": run})
    check("5 kg-capacity carrier cannot take a 30 kg run", s >= 300, msg((s, b)))
    s, b = users["carGood"].rpc("accept_run", {"p_run_id": run})
    check("valid checked carrier accepts the run", s < 300, msg((s, b)) if s >= 300 else "")
    s, b = users["carGood2"].rpc("accept_run", {"p_run_id": run})
    check("second carrier cannot take the same run (first wins)", s >= 300, msg((s, b)))

    # ---- 5. pickup + delivery
    s, b = users["carGood"].rpc("mark_run_picked_up", {"p_run_id": run, "p_transport_cert_no": "  "})
    check("pickup without certificate number rejected", s >= 300, msg((s, b)))
    s, b = users["carGood"].rpc("mark_run_picked_up", {"p_run_id": run, "p_transport_cert_no": "COT-0001"})
    check("pickup with certificate number", s < 300, msg((s, b)) if s >= 300 else "")
    s, sm = svc("GET", "/rest/v1/sms_outbox?select=message&user_id=eq." + users["retA"].id)
    check("butchery SMS contains the 4-digit code",
          any(codeA and codeA in m["message"] for m in sm), "")

    s, r = users["carGood"].rpc("confirm_delivery", {"p_order_id": o1, "p_code": "0000" if codeA != "0000" else "1111",
                                                      "p_method": "cash"})
    check("wrong code returns ok:false and counts attempt", s < 300 and r.get("ok") is False, str(r)[:80])
    s, r = users["carGood"].rpc("confirm_delivery", {"p_order_id": o1, "p_code": codeA, "p_method": "mpesa"})
    check("M-Pesa payment without reference rejected", s >= 300, msg((s, r)))
    s, r = users["carGood"].rpc("confirm_delivery", {"p_order_id": o1, "p_code": codeA, "p_method": "mpesa",
                                                      "p_mpesa_ref": "ABC123XYZ"})
    check("correct code confirms delivery A", s < 300 and r.get("ok") is True, str(r)[:80])
    s, inv = users["retA"].get("retailer_inventory?select=current_stock")
    check("butchery stock updated by 20 kg", s < 300 and any(float(i["current_stock"]) == 20 for i in inv), str(inv))
    s, pay = svc("GET", "/rest/v1/payments?select=method,amount,mpesa_ref&order_id=eq." + str(o1))
    check("payment recorded", s < 300 and len(pay) == 1 and pay[0]["method"] == "mpesa", str(pay))

    s, sec = users["retB"].get("order_secrets?select=delivery_code&order_id=eq." + str(o2))
    codeB = sec[0]["delivery_code"]
    wrong = "0000" if codeB != "0000" else "1111"
    oks = []
    for _ in range(5):
        s, r = users["carGood"].rpc("confirm_delivery", {"p_order_id": o2, "p_code": wrong, "p_method": "cash"})
        oks.append(r.get("ok") if isinstance(r, dict) else None)
    check("five wrong codes all refused", oks == [False] * 5, str(oks))
    s, r = users["carGood"].rpc("confirm_delivery", {"p_order_id": o2, "p_code": codeB, "p_method": "cash"})
    check("order locks after 5 wrong codes (even correct code refused)", s >= 300, msg((s, r)))
    s, b = users["carGood2"].rpc("confirm_delivery", {"p_order_id": o2, "p_code": codeB, "p_method": "cash"})
    check("a carrier not on the run cannot confirm", s >= 300, msg((s, b)))
    s, b = users["carGood"].rpc("fail_delivery", {"p_order_id": o2, "p_reason": "Code lock, retailer unreachable"})
    check("carrier can mark delivery failed", s < 300, msg((s, b)) if s >= 300 else "")
    s, runrow = users["sup"].get("delivery_runs?select=status&id=eq." + str(run))
    check("run completes when no order is moving", runrow and runrow[0]["status"] == "completed", str(runrow))

    # ---- 6. issues, cancel
    s, b = users["retB"].rpc("report_issue", {"p_order_id": o1, "p_type": "short_delivery", "p_description": "x"})
    check("other butchery cannot report an issue on order A", s >= 300, msg((s, b)))
    s, iss = users["retA"].rpc("report_issue", {"p_order_id": o1, "p_type": "short_delivery",
                                                 "p_description": "2 kg short", "p_quantity_short": 2})
    check("butchery reports short delivery", s < 300, msg((s, iss)) if s >= 300 else "")
    s, b = users["sup"].rpc("resolve_issue", {"p_issue_id": iss, "p_resolution": "Credit on next order"})
    check("supplier resolves the issue", s < 300, msg((s, b)) if s >= 300 else "")
    s, o3 = users["retA"].rpc("place_order", {"p_supplier_id": users["sup"].id,
                                               "p_items": [{"listing_id": listing, "quantity": 5}]})
    s, b = users["retA"].rpc("cancel_order", {"p_order_id": o3})
    check("butchery cancels an unconfirmed order", s < 300, msg((s, b)) if s >= 300 else "")
    s, o4 = users["retA"].rpc("place_order", {"p_supplier_id": users["sup"].id,
                                               "p_items": [{"listing_id": listing, "quantity": 5}]})
    s, b = users["sup"].rpc("supplier_respond", {"p_order_id": o4, "p_accept": False, "p_reason": "Out of stock"})
    check("supplier can decline an order", s < 300, msg((s, b)) if s >= 300 else "")
    s, b = users["retA"].rpc("cancel_order", {"p_order_id": o4})
    check("declined order cannot be cancelled again", s >= 300, msg((s, b)))

    # ---- 7. cutoff rule
    s, d = http("POST", "/rest/v1/rpc/next_delivery_date", {"p_at": "2026-10-29T17:59:00Z"}, token=users["retA"].token)
    s2, d2 = http("POST", "/rest/v1/rpc/next_delivery_date", {"p_at": "2026-10-29T18:01:00Z"}, token=users["retA"].token)
    check("cutoff: 20:59 EAT -> tomorrow, 21:01 EAT -> day after",
          (d, d2) == ("2026-10-30", "2026-10-31"), f"{d} / {d2}")

    # ---- summary
    p = sum(1 for _, ok, _ in RESULTS if ok)
    print(f"\n{p}/{len(RESULTS)} passed")
    json.dump(RESULTS, open(os.path.join(os.path.dirname(__file__), "results.json"), "w"))


main()
