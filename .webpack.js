module.exports = {
    context: __dirname,
    entry: "./lib/Promise.js",
    output: {
        filename: "dist/creed.js",
        library: "creed",
        libraryTarget: "umd"
    }
};
