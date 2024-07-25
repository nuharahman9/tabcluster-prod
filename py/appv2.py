from websiteTopicModelv2 import websiteTopicModel
import json 
import pandas as pd 

nmf_model = None 
url_id_map = {} # will map urls to ids, for faster lookup even thoguh its a little redundant 
website_data = pd.DataFrame(columns=['url', 'text']);  # url and corresponding text 

# # modify to either call storage apis 
# def cleanup(): 
#     print("in cleanup\n")
#     for filepath, id in url_id_map.items(): 
#         if os.path.exists(filepath): 
#             try: 
#                 os.remove(filepath)
#                 print(f"{filepath} deleted\n")
#             except Exception as e: 
#                 print("An error occured deleting files: {e}")



# pages[i] = dict of url, id, text
def upload_txt(tabs): 
    pages = json.loads(tabs)
    print(len(pages))
    global url_id_map
    global website_data
    try: 
        for page in pages:
            url = page['url'] 
            id = page['id']
            if page['url'] and page['text']:
                url_id_map[url] = id 
                website_data.loc[len(website_data)] = page
            else: 
                print("something happened with: ", url)
        return json.dumps({ 'status': 200, 'message': "data upload complete"})
    except: 
        return json.dumps({ 'status': 400, 'message': 'F' })

   


# expected 
# num windows = int 
def cluster(numWindows): 
    global url_id_map
    global nmf_model 

    
    topics_website_ids_map = {}
    print("\n==========================================APP.PY URL TO ID====================================\n")
    print(url_id_map)
    print("\n==========================================APP.PY URL TO ID ====================================\n")
    print("in cluster!!!\n")
    if nmf_model is None: 
        nmf_model = websiteTopicModel(n_components=numWindows) 
        topic_doc_map = nmf_model.driver() 
    else: 
        topic_doc_map = nmf_model.recluster(new_components=numWindows)
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