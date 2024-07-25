const path = require('path')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin'); 
const CopyWebpackPlugin = require('copy-webpack-plugin'); 
const nodeExternals = require('webpack-node-externals'); 
// const { PyodidePlugin } = require("@pyodide/webpack-plugin");


module.exports = { 
    entry: {
        popup: './src/popup.js', 
        background: './src/background.js', 
        jquery: './src/lib/jquery.min.js', 
        // 'pdf.worker': 'pdfjs-dist/build/pdf.worker.mjs'
    }, 
    output: { 
        filename: '[name].js', 
        path: path.resolve(__dirname, 'dist')
    }, 
    module: { 
        rules: [
            {
              test: /\.js$/,
              loader: '@open-wc/webpack-import-meta-loader',
              exclude: /(node_modules|py|corpus|static-libraries)/,
            },
          ],
    }, 
    mode: 'production', 
    watch: true, 
    plugins: [ 
        new CopyWebpackPlugin({
            patterns: [{ from: 'static' }, {from: './src/lib/pyodide', to: 'pyodide' }]
        }), 
        new NodePolyfillPlugin(), 
        // new PyodidePlugin(), 
        new webpack.ProvidePlugin({
            $: path.resolve(__dirname, './src/lib/jquery.min.js'),
            jQuery: path.resolve(__dirname, './src/lib/jquery.min.js'),
            pdfjsLib: 'pdfjs-dist/build/pdf', 
        }), 
    ], 
    resolve: { 
        extensions: ['.js', '.mjs'], 
        fallback: {
            "child_process": false, 
            "worker_threads": false, 
            "events": require.resolve("events/"),
            "fs": false,
            "path": require.resolve("path-browserify"),
            "process": require.resolve("process/browser"),
            "stream": require.resolve("stream-browserify"),
            "util": require.resolve("util/")
        }
    }

}