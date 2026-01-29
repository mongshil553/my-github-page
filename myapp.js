var player = videojs('my-player');

const mpd_src = "dir/to/stream.mpd";


async function getConfig() {
  const contentId = "test_contendId"; // Live/VOD Station에 설정한 Multi DRM Content ID :contentReference[oaicite:13]{index=13}
  const userId = "test_userId";
  data = {
    "contentId": contentId,
    "userId": userId,
  };

  try{
    const r = await fetch("https://zf6ixbp7bs7ut23gfkonjml2ae0sjywf.lambda-url.ap-southeast-2.on.aws/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }
    );

    console.log("DEBUG_TEST");

    if (!r.ok) throw new Error(await r.text());
    return await r.json();
    
  } catch(e){
    console.log(e);
    return {};
  }
}

function configureDRM() {
    player.ready(async function () {
        let playerConfig;
        player.eme();

        if ('Widevine' === drmType) {
          const cfg = await getConfig();
          console.log(cfg.licenseUri, cfg.licenseHeaders);

            playerConfig = {
                src: mpd_src,
                type: 'application/dash+xml',
                keySystems: {
                    'com.widevine.alpha': {
                      url: cfg.licenseUri,
                      licenseHeaders: cfg.licenseHeaders,
                    }
                },
            };
        } else {
            console.log("No DRM supported in this browser");
        }
        player.src(playerConfig);
    });
}

async function checkSupportedDRM() {
  const drm = {
      Widevine: { name: 'Widevine', mediaKey: 'com.widevine.alpha' },
      PlayReady: { name: 'PlayReady', mediaKey: 'com.microsoft.playready' },
      FairPlay: { name: 'FairPlay', mediaKey: 'com.apple.fps' }
  };
  
  const baseEmeConfig = [{
    initDataTypes: ['cenc'],
    videoCapabilities: [{
        contentType: 'video/mp4;codecs="avc1.42E01E"'
    }],
    audioCapabilities: [{
        contentType: 'audio/mp4;codecs="mp4a.40.2"'
    }]
  }];

  for (const key in drm) {
      try {
          await navigator.requestMediaKeySystemAccess(drm[key].mediaKey, baseEmeConfig);
          // If the requestMediaKeySystemAccess succeeds, we can assume the browser supports this DRM.
          drmType = drm[key].name;
          console.log(`${drmType} support ok`);
      } catch (e) {
          console.log(`${key} :: ${e}`);
      }
  }
}
function checkBrowser() {
  const agent = navigator.userAgent.toLowerCase();
  const name = navigator.appName;
  let detectedBrowser = 'Unknown';

  if (name === 'Microsoft Internet Explorer' || agent.includes('trident') || agent.includes('edge/')) {
    detectedBrowser = agent.includes('edge/') ? 'Edge' : 'IE';
  } else if (agent.includes('safari')) {
    if (agent.includes('opr')) detectedBrowser = 'Opera';
    else if (agent.includes('whale')) detectedBrowser = 'Whale';
    else if (agent.includes('edg/') || agent.includes('Edge/')) detectedBrowser = 'Edge';
    else if (agent.includes('chrome')) detectedBrowser = 'Chrome';
    else detectedBrowser = 'Safari';
  } else if (agent.includes('firefox')) {
    detectedBrowser = 'Firefox';
  }

  browser = detectedBrowser;
  const result = `Running in ${browser}. ${drmType} supported.`;
  const browserCheckElement = document.getElementById('browserCheckResult');
  // if (browserCheckElement) browserCheckElement.innerHTML = result;
  console.log(result);

  return browser;
}

checkSupportedDRM().then(() => {
    checkBrowser();
    player.ready(function(){
        configureDRM();
    });
    //player.play();
})