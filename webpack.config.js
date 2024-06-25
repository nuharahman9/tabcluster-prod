const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = { 
    entry: {
        jquery: './src/vendor/jquery.min.js',
        popup: './src/popup.js', 
        background: './src/background.js'
        // pdf: './src/pdfjs-dist/build/pdf.mjs', 
        // pdfWorker: './src/pdfjs-dist/build/pdf.worker.mjs'

    }, 
    output: { 
        filename: '[name].js', 
        path: path.resolve(__dirname, 'dist')
    }, 
    module: { 
        // rules: [
        //     {
        //         test: /jquery.+\.js$/,
        //         use: [{
        //             loader: 'expose-loader',
        //             options: 'jQuery'
        //         },{
        //             loader: 'expose-loader',
        //             options: '$'
        //         }]
        //     }
        // ]
    }, 
    mode: 'production', 
    watch: true, 
    plugins: [ 
        new CopyWebpackPlugin({
            patterns: [{ from: 'static' }]
        }), 
        // new webpack.ProvidePlugin({
        //     $: 'jquery', 
        //     jQuery: 'jquery'
        // })
    ]

}