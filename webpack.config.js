const path = require('path')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin'); 
const CopyWebpackPlugin = require('copy-webpack-plugin'); 
const nodeExternals = require('webpack-node-externals'); 


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
              loader: 'node-loader',
              exclude: /(py|corpus|static-libraries|wheel-build)/,
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
            process: path.resolve(__dirname, './src/lib/process/browser.js')

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
            "stream": require.resolve("stream-browserify"),
            "util": require.resolve("util/")
        }
    }

}