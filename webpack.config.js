const webpack = require("webpack");
const path = require("path");

module.exports = {
    entry: './index.ts',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },

    resolve: {
        extensions: [".ts", ".js"]
    },

    module: {
        rules: [
            { test: /\.ts$/, loader: "awesome-typescript-loader" },
            { test: /\.md5mesh$/, use: "raw-loader" },
            { test: /\.glslx$/, use: "raw-loader" }
        ]
    },

    plugins: [
        new webpack.LoaderOptionsPlugin({
          debug: true
        })
    ]

};