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
              test: /\.node$/,
              loader: 'node-loader'
            },
            {
                test: /\.js$/,
                exclude: /(py|corpus|static-libraries|wheel-build|node_modules)/,
                use: { 
                    loader: 'babel-loader', 
                    options: { 
                        presets: ['@babel/preset-env']
                    }
                }
              },
          ],
    }, 
    mode: 'production', 
    watch: true, 
    plugins: [ 
        new CopyWebpackPlugin({
            patterns: [{ from: 'static' }, {from: './src/lib/pyodide', to: 'pyodide' }, {from: './wheel-build/dist/tabcluster-0.1.0-py3-none-any.whl', to: 'pyodide'}]
        }), 
        new NodePolyfillPlugin(), 
        // new PyodidePlugin(), 
        new webpack.ProvidePlugin({
            $: path.resolve(__dirname, './src/lib/jquery.min.js'),
            jQuery: path.resolve(__dirname, './src/lib/jquery.min.js'),
            // pdfjsLib: 'pdfjs-dist/build/pdf', 
            process: 'process/browser'

        })
    ], 
    resolve: { 
        extensions: ['.js', '.mjs'], 
        fallback: {
            "child_process": false, 
            "worker_threads": false, 
            "events": require.resolve("events/"),
            "process": require.resolve("process/browser"), 
            "fs": false,
            "path": require.resolve("path-browserify"),
            "stream": require.resolve("stream-browserify"),
            "util": require.resolve("util/")
        }
    }

}