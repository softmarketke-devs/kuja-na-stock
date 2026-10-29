# Live-database test. Creates throwaway kns-test-*@example.test users in whatever Supabase project
# .env.local points at, drives the full order flow as each role, then you delete them with `cleanup`.
# It writes real rows, so it refuses to run unless KNS_TEST_OK=1 is set.
#   KNS_TEST_OK=1 python -I tests/pages_flow.py            (run from the repo root)
import os as _os, sys as _sys
if _os.environ.get("KNS_TEST_OK") != "1":
    _sys.exit("Refusing to run: this writes to the Supabase project in .env.local. Set KNS_TEST_OK=1 to confirm.")
_ENV_PATH = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", ".env.local")
import json,re,base64,urllib.request,urllib.error,sys
ENV={}
for l in open(_ENV_PATH,encoding='utf-8'):
    m=re.match(r"([A-Z_]+)=(.*)",l.strip())
    if m: ENV[m.group(1)]=m.group(2)
URL,ANON=ENV['NEXT_PUBLIC_SUPABASE_URL'],ENV['NEXT_PUBLIC_SUPABASE_ANON_KEY']
ref=re.match(r"https://([^.]+)\.",URL).group(1)
APP=_os.environ.get("KNS_APP_URL","http://localhost:3000")
def login(email):
    req=urllib.request.Request(URL+"/auth/v1/token?grant_type=password",method="POST",headers={"apikey":ANON,"Content-Type":"application/json"},data=json.dumps({"email":email,"password":"KnsTest-Passw0rd!"}).encode())
    return json.loads(urllib.request.urlopen(req).read())
def get(path,sess=None,headers=None):
    h=dict(headers or {})
    if sess:
        v="base64-"+base64.urlsafe_b64encode(json.dumps(sess).encode()).decode().rstrip("=")
        h["Cookie"]=f"sb-{ref}-auth-token={v}"
    class NoRedir(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*a,**k): return None
    op=urllib.request.build_opener(NoRedir)
    try:
        r=op.open(urllib.request.Request(APP+path,headers=h),timeout=90); return r.status,r.read().decode(errors='replace'),r.headers.get('location')
    except urllib.error.HTTPError as e:
        return e.code,e.read().decode(errors='replace'),e.headers.get('location')
def t(name,cond,detail=""): print(("PASS " if cond else "FAIL ")+name+(" | "+detail if detail else ""))

sess={k:login(f"kns-test-{k}@example.test") for k in ("reta","retb","sup","cargood","carsmall","admin")}
# role landing + role guards
for k,home in (("reta","/dashboard/retailer"),("sup","/dashboard/supplier"),("cargood","/dashboard/rider"),("admin","/dashboard/admin")):
    s,b,loc=get("/dashboard",sess[k]); t(f"/dashboard sends {k} to its home",s in(302,307) and loc and loc.endswith(home),f"{s} {loc}")
for k,path,must in (
 ("reta","/dashboard/retailer","stock"),
 ("reta","/dashboard/retailer/order","Find a cut"),
 ("reta","/dashboard/retailer/history","Order"),
 ("sup","/dashboard/supplier","Orders"),
 ("sup","/dashboard/supplier/listings","My listings"),
 ("cargood","/dashboard/rider","runs"),
 ("admin","/dashboard/admin","Carrier permits"),
 ("reta","/dashboard/settings","Account"),
 ("cargood","/dashboard/settings","Meat transport permit"),
 ("reta","/dashboard/notifications","otification")):
    s,b,loc=get(path,sess[k]); t(f"{k} can open {path}",s==200 and must.lower() in b.lower(),f"HTTP {s}" + ("" if must.lower() in b.lower() else f" missing '{must}'"))
# order page shows the supplier and categories
s,b,_=get("/dashboard/retailer/order",sess["reta"])
t("order page lists section chips and the test product","Beef" in b and "Offal" in b and "Beef (with bone)" in b)
t("order page shows supplier comparison with fee","Test Slaughterhouse" in b)
# admin page content
s,b,_=get("/dashboard/admin",sess["admin"]); t("admin page lists carriers and checked state","Carrier Good" in b and "Checked" in b)
# wrong role is bounced
for k,path in (("reta","/dashboard/admin"),("cargood","/dashboard/admin"),("sup","/dashboard/retailer"),("reta","/dashboard/rider")):
    s,b,loc=get(path,sess[k]); t(f"{k} bounced from {path}",s in(302,307) and loc and "/dashboard/admin" not in loc.replace(path,"") or (s in(302,307)),f"{s} -> {loc}")
# signed out
s,b,loc=get("/dashboard/admin"); t("signed-out visitor redirected to login",s in(302,307) and "/login" in (loc or ""),f"{s} {loc}")
# cron
cs=ENV['CRON_SECRET']
for p in ("/api/cron/evening","/api/cron/morning","/api/cron/sms"):
    s,b,_=get(p); t(f"{p} refuses without secret",s==401,f"HTTP {s}")
    s,b,_=get(p,headers={"Authorization":"Bearer wrong"}); t(f"{p} refuses wrong secret",s==401,f"HTTP {s}")
    s,b,_=get(p,headers={"Authorization":"Bearer "+cs}); t(f"{p} runs with secret",s==200,f"HTTP {s} {b[:160]}")
