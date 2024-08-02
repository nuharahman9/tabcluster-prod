from websiteTopicModel import websiteTopicModel
import json 
import gc
import pandas as pd 


gc.enable()
gc.set_debug(gc.DEBUG_LEAK)


nmf_model = None 
url_id_map = {} # will map urls to ids, for faster lookup even thoguh its a little redundant 
urls = [] 
website_data = pd.DataFrame(columns=['url', 'id', 'text']);  # url and corresponding text 

# modify to either call storage apis 
def cleanup(): 
    global urls 
    global website_data
    global url_id_map
    website_data.drop(website_data.index)
    url_id_map = {}
    urls = [] 




# pages[i] = dict of url, id, text
def upload_text(tabs): 
    print("upload_text")
    pages = json.loads(tabs)
    print(len(pages))
    print(pages)
    global url_id_map
    global website_data
    try: 
        for page in pages:
            url = page['url'] 
            id = page['id']
            if page['url'] and page['text']:
                url_id_map[url] = id
                urls.append(url)
                website_data.loc[len(website_data)] = page
            else: 
                print("something happened with: ", url)
        print("website data: ", website_data)
        print("end upload text")
        return json.dumps({ 'status': 200, 'message': "data upload complete"})
    except: 
        return json.dumps({ 'status': 400, 'message': 'F' })

   

# HEY DONT FORGET TO UPDATE RECLUSTER TOO! 
# expected 
# num windows = int 
def cluster(data): 
    global url_id_map
    global nmf_model 
    unpacked = json.loads(data)
    numWindows = unpacked['numWindows']
    punkt = unpacked['punktUrl']
    print("website data read text: ", website_data.shape[0])
    print("in cluster")
    topics_website_ids_map = {}
    print("\n==========================================APP.PY URL TO ID====================================\n")
    print(url_id_map)
    print("\n==========================================APP.PY URL TO ID ====================================\n")
    print("in cluster!!!\n")
    if nmf_model is None: 
        nmf_model = websiteTopicModel(n_components=numWindows) 
        topic_doc_map = nmf_model.driver(website_data, urls, punkt_url=punkt) 
    else: 
        topic_doc_map = nmf_model.recluster(new_components=numWindows, data=website_data, urls=urls)
    print("\n==========================================APP.PY RETURNED OUTPUT====================================\n")
    print(topic_doc_map)
    print("\n==========================================APP.PY RETURNED OUTPUT====================================\n")
    if topic_doc_map:  
        for topicNum, file_paths in topic_doc_map.items(): 
            print(f"Topic {topicNum}:")
            for file in file_paths: 
                print(f"  - {file}")
                if topicNum not in topics_website_ids_map: 
                    topics_website_ids_map[topicNum] = [url_id_map[file]]
                else: 
                    topics_website_ids_map[topicNum].append(url_id_map[file])
        print(topics_website_ids_map) 
        cleanup()

        return topics_website_ids_map
    else: 
        return "something went wrong."


