
const fetch = require('node-fetch');
const Telegraf = require('telegraf');

const { isVideo,
    hasMinViews,
    isGoodVideoFormat,
    isFreshVideo,
    getVideoDuration
} = require('./util/video');

let hashtagList = [];

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Welcome to the fishing bot. Enter the one hashtag you want to track!'));

bot.command('stop', (ctx) => {
    const id = ctx.update.message.from.id;

    hashtagList = hashtagList.filter(item => item.id !== id);

    ctx.reply(`All hashtags have been removed.`);
});

bot.on('text', (ctx) => {
    const id = ctx.update.message.from.id;
    const hashtag = ctx.update.message.text;

    hashtagList.push({ id, hashtag });

    ctx.reply(`Started tracking hashtag ${hashtag}`);
});

const getResource = async (url) => {
    const res = await fetch('https://www.instagram.com/' + url);

    if (!res.ok) {
        throw new Error(`Could not fetch ${url}, received ${res.status}`);
    }

    return await res.json();
}

const getContent = async (posts) => {
    let data = [];

    const videoWithTheMostViews = posts.filter(post => {
        return isVideo(post) && isFreshVideo(post) && isGoodVideoFormat(post) && hasMinViews(post) ? true : false
    }).sort((a, b) => b.node.video_view_count - a.node.video_view_count) || null;

    if (videoWithTheMostViews !== null && videoWithTheMostViews.length !== 0) {
        for (let item of videoWithTheMostViews) {
            const res = await getResource(`/p/${item.node.shortcode}/?__a=1`);
            const { video_duration, shortcode } = res.graphql.shortcode_media

            if (video_duration <= 30) data.push(shortcode);
        }
    }

    return data.length !== 0 ? data : null;
}

const fetchContent = async () => {
    let content = [];

    for (let { id, hashtag } of hashtagList) {
        const res = await getResource(`explore/tags/${hashtag}/?__a=1`);
        const shortcodeList = await getContent(res.graphql.hashtag.edge_hashtag_to_media.edges);

        if (shortcodeList !== null) {
            shortcodeList.forEach(shortcode => {
                bot.telegram.sendMessage(id, `https://www.instagram.com/p/${shortcode}/`);
            })
        }
    }
};

let timer = setInterval(fetchContent, 300000);

bot.launch()