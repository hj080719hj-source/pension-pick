export async function runRewardedAd(sdk, adGroupId) {
  if (!adGroupId || !sdk.loadFullScreenAd.isSupported() || !sdk.showFullScreenAd.isSupported()) {
    throw Error('토스 앱의 보상형 광고를 이용할 수 없는 환경이에요.');
  }
  await new Promise((resolve, reject) => {
    let cleanup, done = false;
    const finish = error => {
      if (done) return; done = true; clearTimeout(timer); cleanup?.();
      error ? reject(error) : resolve();
    };
    const timer = setTimeout(()=>finish(Error('광고를 불러오지 못했어요. 다시 시도해 주세요.')),15000);
    try {
      cleanup = sdk.loadFullScreenAd({options:{adGroupId},
        onEvent:e=>{if(e.type==='loaded')finish();},
        onError:()=>finish(Error('광고를 불러오지 못했어요. 다시 시도해 주세요.'))});
      if (done) cleanup?.();
    } catch { finish(Error('광고를 불러오지 못했어요.')); }
  });
  return new Promise((resolve,reject) => {
    let cleanup, done=false, earned=false;
    const finish = error => {
      if(done)return;done=true;clearTimeout(timer);cleanup?.();
      if(earned)resolve(); else reject(error || Error('광고를 끝까지 시청하면 10개를 더 받을 수 있어요.'));
    };
    const timer=setTimeout(()=>finish(Error('광고 응답이 지연되고 있어요. 다시 시도해 주세요.')),180000);
    try {
      cleanup=sdk.showFullScreenAd({options:{adGroupId},onEvent:event=>{
        if(done)return;
        if(event.type==='userEarnedReward')earned=true;
        if(event.type==='dismissed')finish();
        if(event.type==='failedToShow')finish(Error('광고를 표시하지 못했어요.'));
      },onError:()=>finish(Error('광고를 표시하지 못했어요.'))});
      if(done)cleanup?.();
    } catch { finish(Error('광고를 표시하지 못했어요.')); }
  });
}
