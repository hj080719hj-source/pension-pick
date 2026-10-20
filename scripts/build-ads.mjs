import {build} from 'esbuild';
const adGroupId = process.env.PENSION_REWARDED_AD_GROUP_ID;
if (!adGroupId) throw Error('Set PENSION_REWARDED_AD_GROUP_ID to the rewarded ad group from the Toss console.');
await build({
  stdin:{contents:`import {loadFullScreenAd,showFullScreenAd} from '@apps-in-toss/web-framework';
import {runRewardedAd} from './public/rewarded-ad.mjs';
export const earnReward=()=>runRewardedAd({loadFullScreenAd,showFullScreenAd},${JSON.stringify(adGroupId)});`,
  resolveDir:process.cwd(),sourcefile:'toss-ads-entry.mjs'},
  bundle:true,format:'esm',platform:'browser',outfile:'public/toss-ads.mjs',minify:true
});
