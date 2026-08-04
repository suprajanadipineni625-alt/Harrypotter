import { Config } from '@remotion/cli/config'

/**
 * H.264 + AAC in MP4 is what Instagram accepts (BUILD-CONSTRAINTS §3).
 * CRF 18 is visually lossless enough to survive their re-encode; the platform
 * will compress it again regardless, so handing them a soft source compounds.
 */
Config.setVideoImageFormat('jpeg')
Config.setCodec('h264')
Config.setCrf(18)
Config.overrideWebpackConfig((c) => c)
