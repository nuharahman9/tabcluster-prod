const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = { 
    entry: {
        popup: './src/popup.js', 
        background: './src/background.js', 
        'pdf.worker': 'pdfjs-dist/build/pdf.worker.mjs'
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
        new webpack.ProvidePlugin({
            $: path.resolve(__dirname, './src/lib/jquery.min.js'),
            jQuery: path.resolve(__dirname, './src/lib/jquery.min.js'),
            pdfjsLib: 'pdfjs-dist/build/pdf'
            
        }), 
    ], 

    resolve: { 
        extensions: ['.js', '.mjs']
    }

}