import json
import os

# Comprehensive list of ad, tracker, popup, and telemetry domains
DOMAINS = [
    # --- Google & DoubleClick Ad Ecosystem ---
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "adservice.google.com",
    "pagead2.googlesyndication.com",
    "admob.com",
    "google-analytics.com",
    "analytics.google.com",
    "stats.g.doubleclick.net",
    "cm.g.doubleclick.net",
    "securepubads.g.doubleclick.net",
    "fundingchoicesmessages.google.com",
    "partner.googleadservices.com",
    "afs.googlesyndication.com",
    "tpc.googlesyndication.com",

    # --- YouTube Ad Trackers & Telemetry (Safe for video streams) ---
    "youtube.com/api/stats/ads",
    "youtube.com/pagead",
    "youtube.com/ptracking",
    "youtube.com/get_midroll_info",

    # --- Major Programmatic Ad Exchanges & SSPs / DSPs ---
    "adnxs.com",
    "adnxs.net",
    "ib.adnxs.com",
    "criteo.com",
    "criteo.net",
    "static.criteo.net",
    "rubiconproject.com",
    "fastlane.rubiconproject.com",
    "pubmatic.com",
    "ads.pubmatic.com",
    "openx.net",
    "casalemedia.com",
    "indexexchange.com",
    "smartadserver.com",
    "yieldmo.com",
    "triplelift.com",
    "sharethrough.com",
    "sovrn.com",
    "lijit.com",
    "media.net",
    "contextual.media.net",
    "advertising.com",
    "bidswitch.net",
    "smaato.net",
    "inmobi.com",
    "flashtalking.com",
    "adform.net",
    "adtechus.com",
    "adblade.com",
    "adcolony.com",
    "applovin.com",
    "ironsrc.com",
    "unityads.unity3d.com",
    "vungle.com",
    "chartbeat.com",
    "chartbeat.net",
    "moatads.com",
    "iasds01.com",
    "integralads.com",
    "quantserve.com",
    "scorecardresearch.com",
    "bluekai.com",
    "demdex.net",
    "adroll.com",
    "dpm.demdex.net",
    "agkn.com",
    "turn.com",
    "rfihub.com",
    "eyeota.net",
    "mathtag.com",
    "mookie1.com",
    "simpli.fi",
    "zemanta.com",
    "gumgum.com",
    "undertone.com",
    "yieldlove.com",
    "snigelweb.com",
    "playwire.com",
    "monetizemore.com",
    "setupad.net",
    "setupad.com",
    "ezoic.net",
    "ezoic.com",
    "adthrive.com",
    "mediavine.com",
    "adpushup.com",
    "infolinks.com",
    "buysellads.com",
    "carbonads.net",

    # --- Video & Rich Media Ad Platforms ---
    "teads.tv",
    "teads.com",
    "connatix.com",
    "primis.tech",
    "anyclip.com",
    "aniview.com",
    "vidoomy.com",
    "unruly.co",
    "spotxchange.com",
    "spotx.tv",
    "tremorhub.com",
    "freewheel.tv",
    "fwmrm.net",
    "brightroll.com",

    # --- Recommendation & Native Clickbait Widgets ---
    "outbrain.com",
    "outbrainimg.com",
    "taboola.com",
    "taboolasyndication.com",
    "revcontent.com",
    "mgid.com",
    "zergnet.com",
    "content.ad",
    "nativo.com",
    "dianomi.com",
    "engagebdr.com",
    "adcell.com",
    "adkernel.com",

    # --- Aggressive Popunder, Streaming & Redirect Ad Networks ---
    "popads.net",
    "popcash.net",
    "propellerads.com",
    "adsterra.com",
    "exoclick.com",
    "trafficjunky.com",
    "juicyads.com",
    "hilltopads.net",
    "clickadu.com",
    "monetag.com",
    "yllix.com",
    "admaven.com",
    "bidvertiser.com",
    "revenuehits.com",
    "clickor.com",
    "richaudience.com",
    "adcash.com",
    "popmyads.com",
    "ero-advertising.com",
    "trafficfactory.biz",
    "plugrush.com",
    "hubtraffic.com",
    "a-ads.com",
    "coinzilla.com",
    "bitmedia.io",

    # --- Social & Big Tech Ad Trackers / Pixels ---
    "pixel.facebook.com",
    "an.facebook.com",
    "connect.facebook.net/en_US/fbevents.js",
    "analytics.tiktok.com",
    "ads-twitter.com",
    "static.ads-twitter.com",
    "analytics.twitter.com",
    "snap.licdn.com",
    "px.ads.linkedin.com",
    "tr.snapchat.com",
    "sc-static.net",
    "ads.pinterest.com",
    "ct.pinterest.com",
    "bat.bing.com",
    "mc.yandex.ru",
    "metrika.yandex.ru",
    "top-fwz1.mail.ru",

    # --- User Session Recording & Behavioral Telemetry ---
    "hotjar.com",
    "static.hotjar.com",
    "clarity.ms",
    "c.bing.com",
    "crazyegg.com",
    "mouseflow.com",
    "fullstory.com",
    "rs.fullstory.com",
    "inspectlet.com",
    "luckyorange.com",
    "luckyorange.net",
    "logrocket.com",
    "smartlook.com",
    "heapanalytics.com",
    "sessioncam.com",

    # --- Analytics & Attribution SDKs ---
    "segment.io",
    "api.segment.io",
    "mixpanel.com",
    "api.mixpanel.com",
    "amplitude.com",
    "api.amplitude.com",
    "branch.io",
    "app.link",
    "adjust.com",
    "app.adjust.com",
    "appsflyer.com",
    "kochava.com",
    "singular.net",
    "braze.com",
    "onesignal.com",
    "optimizely.com",
    "cdn.optimizely.com",
    "vwo.com",
    "kameleoon.eu"
]

# High-frequency URL patterns and script paths (excluding video playback stream chunks)
PATTERNS = [
    "*/pagead/js/adsbygoogle.js",
    "*/pagead/show_ads.js",
    "*/google-analytics.com/analytics.js",
    "*/google-analytics.com/ga.js",
    "*/googletagservices.com/tag/js/gpt.js",
    "*/googletagmanager.com/gtag/js*",
    "*/googletagmanager.com/gtm.js*",
    "*/connect.facebook.net/*/fbevents.js",
    "*/clarity.ms/tag/*",
    "*/static.hotjar.com/c/hotjar-*.js",
    "*://*/*adserver*",
    "*://*/*ad_banner*",
    "*://*/*adbanner*",
    "*://*/popunder.js*",
    "*://*/*pop_ads*",
    "*://*/*popupads*",
    "*://*/ad_tag*",
    "*://*/banner_ads/*",
    "*://*/floating_ad/*",
    "*://*/*advertisement*.js",

    # YouTube Specific ad metadata/tracking endpoints (leaves googlevideo.com streaming chunks intact)
    "*://*.youtube.com/api/stats/ads*",
    "*://*.youtube.com/pagead/*",
    "*://*.youtube.com/ptracking*",
    "*://*.youtube.com/get_midroll_info*",
    "*://*.youtube.com/youtubei/v1/player/ad_break*"
]

RESOURCE_TYPES = [
    "script",
    "image",
    "xmlhttprequest",
    "sub_frame",
    "ping",
    "media",
    "websocket",
    "other"
]

rules = []
current_id = 1

# 1. Domain blocks
for item in DOMAINS:
    if "/" in item:
        rules.append({
            "id": current_id,
            "priority": 2,
            "action": { "type": "block" },
            "condition": {
                "urlFilter": f"||{item}",
                "resourceTypes": RESOURCE_TYPES
            }
        })
    else:
        rules.append({
            "id": current_id,
            "priority": 1,
            "action": { "type": "block" },
            "condition": {
                "urlFilter": f"||{item}^",
                "resourceTypes": RESOURCE_TYPES
            }
        })
    current_id += 1

# 2. Pattern blocks
for pat in PATTERNS:
    rules.append({
        "id": current_id,
        "priority": 2,
        "action": { "type": "block" },
        "condition": {
            "urlFilter": pat,
            "resourceTypes": RESOURCE_TYPES
        }
    })
    current_id += 1

output_path = r"D:\adshield-chrome-extension\rules\rules.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(rules, f, indent=2)

print(f"Generated {len(rules)} declarativeNetRequest rules at {output_path}")
