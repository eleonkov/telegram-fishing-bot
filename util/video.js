const moment = require('moment');

const isVideo = post => post.node.__typename === "GraphVideo";
const hasMinViews = post => post.node.video_view_count > 20
const isGoodVideoFormat = (post) => post.node.dimensions.height >= post.node.dimensions.width;
const isFreshVideo = (post) => {
    const timestamp = post.node.taken_at_timestamp;

    return (timestamp > moment().subtract(7, 'minutes').unix()
        && timestamp < moment().subtract(2, 'minutes').unix());
}

exports.isVideo = isVideo;
exports.hasMinViews = hasMinViews;
exports.isGoodVideoFormat = isGoodVideoFormat;
exports.isFreshVideo = isFreshVideo;