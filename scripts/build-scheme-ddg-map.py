#!/usr/bin/env python3
"""Build src/data/scheme-ddg-map.json by fuzzy-matching scheme names against
DDG sub-head / minor-head / object-head names within the same demand."""
import json, re, sys
from collections import defaultdict

SCHEMES = json.load(open('src/data/schemes.json'))
DDG = json.load(open('src/data/ddgs/all-ddg.json'))

STOP = {'scheme','schemes','programme','program','national','mission','for','of','the','and','to','in','on','with','project','development','yojana','plan','fund','centrally','sponsored','sector','centre','central','government','india','indian','department','ministry'}

def tokens(s):
    s = re.sub(r'[^a-z0-9]+',' ',(s or '').lower())
    return [t for t in s.split() if len(t)>2 and t not in STOP]

def norm(s):
    return re.sub(r'\s+',' ',re.sub(r'[^a-z0-9]+',' ',(s or '').lower())).strip()

by_demand = defaultdict(list)
for r in DDG:
    by_demand[r['demandNo']].append(r)

def match_scheme(scheme):
    demand = scheme['grantCode']
    leaves = by_demand.get(demand, [])
    if not leaves: return None
    sname = scheme['schemeName']
    s_norm = norm(sname)
    s_toks = set(tokens(sname))
    if not s_toks: return None

    groups = {}
    for r in leaves:
        for level, name, key in [
            ('subHead', r['subHeadName'], (r['minorHead'], r['subHead'], r['detailedHead'])),
            ('minor', r['minorHeadName'], (r['subMajor'], r['minorHead'])),
            ('object', r['objectHeadName'], (r['minorHead'], r['subHead'], r['detailedHead'], r['objectHead'])),
        ]:
            n = norm(name)
            if not n: continue
            groups.setdefault((level, n), []).append(r)

    best = None
    for (level, n), rs in groups.items():
        nt = set(tokens(n))
        if not nt: continue
        inter = s_toks & nt
        union = s_toks | nt
        jacc = len(inter)/len(union)
        sub = (s_norm in n) or (n in s_norm and len(n) > 8)
        score = jacc + (0.3 if sub else 0)
        # Prefer subHead level over minor (less ambiguous)
        if level == 'subHead': score += 0.05
        if (len(inter) >= 2) or (sub and len(inter)>=1):
            if not best or score > best[0]:
                best = (score, level, rs, n, jacc, sub)

    if not best: return None
    score, level, rs, matched_name, jacc, sub = best
    if jacc < 0.4 and not sub: return None
    confidence = 'exact' if (jacc>=0.85 or (sub and jacc>=0.5)) else 'fuzzy'
    seen=set(); ids=[]
    for r in rs:
        if r['id'] not in seen:
            seen.add(r['id']); ids.append(r['id'])
    leaf_map = {r['id']: r for r in DDG}
    total = sum(leaf_map[i]['be2627'] for i in ids if leaf_map[i].get('be2627'))
    return {
        'matchedAtLevel': level,
        'matchConfidence': confidence,
        'matchedName': matched_name,
        'matchedLeafIds': ids,
        'sumMatchedBE2627': round(total, 2),
    }

target_types = {'Centrally Sponsored Scheme','Central Sector Scheme'}
out = []
for s in SCHEMES:
    entry = {
        'schemeCode': s['schemeCode'],
        'schemeName': s['schemeName'],
        'schemeType': s['schemeType'],
        'ministry': s['ministry'],
        'demandNo': s['grantCode'],
        'outlayCr': s['outlayCr'],
        'sumMatchedBE2627': None,
        'matchedAtLevel': None,
        'matchConfidence': 'none',
        'matchedLeafIds': [],
        'matchedName': None,
        'reconStatus': 'unmatched',
        'ddgAvailableForDemand': s['grantCode'] in by_demand,
    }
    if s['schemeType'] in target_types and s['grantCode'] in by_demand:
        m = match_scheme(s)
        if m:
            entry.update(m)
            o = s['outlayCr']; sm = m['sumMatchedBE2627']
            diff = sm - o
            if abs(diff) < 1: entry['reconStatus'] = 'match'
            elif o>0 and abs(diff)/o < 0.05: entry['reconStatus'] = 'close'
            else: entry['reconStatus'] = 'off'
    out.append(entry)

json.dump({'schemes': out}, open('src/data/scheme-ddg-map.json','w'), indent=1)

# Coverage report
from collections import Counter
c = Counter(e['matchConfidence'] for e in out if e['schemeType'] in target_types)
r = Counter(e['reconStatus'] for e in out if e['schemeType'] in target_types)
print('confidence:', dict(c))
print('reconStatus:', dict(r))
print('total CSS+CS:', sum(1 for e in out if e['schemeType'] in target_types))
