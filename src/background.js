importScripts('./pyodide/xhrshim.js')
self.XMLHttpRequest = self.XMLHttpRequestShim 
importScripts('./pyodide/pyodide.js')


let micropip; 
let pyodide;
let websiteTopicModel; 

loadPyodide({}).then((_pyodide) => {
    pyodide = _pyodide;
    console.log("pyodide loaded\n")
});


async function init() { 
    await pyodide.loadPackage("micropip"); 
    const micropip = pyodide.pyimport("micropip"); 
    await micropip.install(chrome.runtime.getURL('./pyodide/js-1.0-py3-none-any.whl'));
    await micropip.install(chrome.runtime.getURL('./pyodide/pathlib-1.0.1-py3-none-any.whl')); 
    await micropip.install(chrome.runtime.getURL('./pyodide/tabcluster-0.1.0-py3-none-any.whl')); 

    websiteTopicModel = pyodide.pyimport("websiteTopicModel"); 

    const dater = JSON.stringify({ punkturl: chrome.runtime.getURL('./pyodide/punkt.zip') }); 
    await websiteTopicModel.init_punkt(dater)
}





// ========================== pyodide ==========================


function rearrangeTabsv2(tabGroups) {
    for (const [key, value] of tabGroups.entries()) { 
        let tabIds = value
        console.log(tabIds)
        if (tabIds.length) { 
            chrome.tabs.group({ tabIds: tabIds }, groupId => {}) 
        }
    }

 }




// call cluster by url 
function groupByDomain(tabs) { 
    let domain_tabIds = {}
    for (let tab of tabs) { 
        let url = tab.url 
        var pathArr = url.split('/')
        var host = pathArr[2]
        if (domain_tabIds[host]) {
            let curr = domain_tabIds[host]
            curr.push(tab.id)
            domain_tabIds[host] = curr
        } else { 
            domain_tabIds[host] = [tab.id]
        }
    }

    console.log("groupbyDomain: ", domain_tabIds)

    rearrangeTabsv2(domain_tabIds)
}



// call cluster method using NMF 
async function cluster(numWindows) { 
    // change this to just be a python object? 
    const data = JSON.stringify({ numWindows: numWindows }); 
    const res = await websiteTopicModel.cluster(data)
    console.log(res)
    topic_map = res.toJs() 
    console.log("to_js(): ", topic_map)
    console.log(typeof topic_map)
    rearrangeTabsv2(topic_map)

}



async function sendTextv3(tabs) { 
    await websiteTopicModel.upload_text(JSON.stringify(tabs))

    const data = JSON.stringify({ numWindows: -1 }); 
    const res = await websiteTopicModel.cluster(data)
    console.log(res)
    topic_map = res.toJs() 
    console.log("to_js(): ", topic_map)
    console.log(typeof topic_map)
    for (const [key, value] of topic_map.entries()) { 
        console.log(key, value)
    }
    // topic_map = JSON.parse(res)
    // console.log(re)
    re.destroy(); 
    res.destroy(); 
    re.destroy()

}





// communication with popup script 
chrome.runtime.onMessage.addListener(async (data, sender, sendResponse) => {

    if (data.message == "init") { 
        await init(); 
    }

    else if (data.message == "sendText") { 
        const tabs = data.tabs; 
        const len = data.length; 
        console.log("tabs: ", tabs); 
        const numWindows = data.numWindows
        const response = await sendTextv3(tabs); 
        if (response.status === 200) { 
            cluster(numWindows); 
        } else { 
            console.error("[Chrome Runtime Listener] Cluster failed.")
        }

    } 

    else if (data.message === 'clusterUrl') { 
        chrome.tabs.query({ currentWindow: true }, tabs => groupByDomain(tabs)); 
    }

    else if (data.message === 'getNumWindows') { 
        console.log("bg js  get numWindows")
        chrome.tabs.query({ currentWindow: true }, tabs => sendResponse({ numWindows: tabs.length })); 
    }



});



