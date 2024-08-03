import pandas as pd 
import string 
import gc 
from pyodide import proxy 
import json 
from js import fetch 
from pathlib import Path 
import os, sys, io, zipfile  
import numpy as np 
from nltk import word_tokenize
from nltk.corpus import stopwords   
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF 
from gensim.models.coherencemodel import CoherenceModel
from gensim.corpora.dictionary import Dictionary 
import re 

gc.enable() 
gc.set_debug(gc.DEBUG_LEAK)

class websiteTopicModel: 
    n_components: int 
    vectorizer: TfidfVectorizer
    topics: list[list[str]]
    topic_doc_map: list[str]    
    nmf_model: NMF 
    num_tabs: int  
    ps: PorterStemmer 
    H: np.ndarray 
    W: np.ndarray 
    stopwords: stopwords
        

    def __init__(self, n_components): 
        self.n_components = n_components
        self.vectorizer = TfidfVectorizer(max_df=0.95, ngram_range=(2, 3), stop_words='english')
        self.file_paths = []
        self.tfidf_matrix = None 
        self.tokens = None 
        self.W = None 
        self.ps = PorterStemmer()
        self.H = None 
        self.num_tabs = 0
        self.websites_preprocessed_data = [] 
        self.topics = [] 
        self.topic_doc_map = []

    

    # modification : expected to get array of texts 
    def read_txt(self, website_data): 
        print("[websiteTopicModel]: enter read_txt\n")
        print("shape: ", website_data.shape[0])
        self.num_tabs = website_data.shape[0]
        for index, row in website_data.iterrows(): 
            text = row['text']
            text = re.sub(r'\n', '', text)
            text = re.sub(r'\d', '', text)
            text = text.translate(str.maketrans('', '', string.punctuation))
            text = text.strip()
            text = text.lower()
            tokenized_words = word_tokenize(text)
            tokenized_words = [self.ps.stem(word) for word in tokenized_words]
            self.websites_preprocessed_data.append(' '.join(tokenized_words))

        print("[websiteTopicModel]: finished processing text\n")



        
    
    def create_tfidf_matrix(self): 
        if self.tfidf_matrix == None: 
            self.tfidf_matrix = self.vectorizer.fit_transform(self.websites_preprocessed_data)
            print("vectorizer created\n")
        else: 
            # add to tf-idf matrix if nmf already ran 
            self.tfidf_matrix = self.vectorizer.transform(self.websites_preprocessed_data)
            print("vectorizer updated\n")
        
    
    def generate_nmf_model(self): 
        print("entering generate_nmf_model\n")
        if (self.n_components == -1): 
            self.approximate_best_n()
        else: 
            self.nmf_model = NMF(n_components=self.n_components, random_state=1,  solver='mu')
            self.W = self.nmf_model.fit_transform(self.tfidf_matrix) 
            self.H = self.nmf_model.components_ 
    
    def convert_strings_to_words(self): 
        word_lists = [] 
        for website in self.websites_preprocessed_data: 
            words = website.split()
            word_lists.append(words)
        return word_lists 
    
    
    def recluster(self, new_components, data, urls): 
        ## reinitialize 
        self.n_components = new_components
        self.file_paths = [] 
        self.websites_preprocessed_data = [] 
        self.topics = [] 
        self.topic_doc_map = []

        return self.driver(data, urls) 



    def approximate_best_n(self):
        word_lists = self.convert_strings_to_words()
        dict = Dictionary(word_lists)
        corpus = [dict.doc2bow(text) for text in word_lists]
        best_num_topics = 0 
        best_coherence = float('-inf')
      #  prev_coherence = 0 
        min = 2
        print("approximate_best_n: ", min, self.num_tabs)
        for i in range(1, self.num_tabs): # dont wanna have a window with just one page - open for suggestion on this one ?
            curr_topics = [] 
            self.nmf_model = NMF(n_components=i, random_state=60, solver='mu', init='nndsvda')
            self.W = self.nmf_model.fit_transform(self.tfidf_matrix)
            self.H = self.nmf_model.components_  
            curr_topics = self.get_topics()

            cm = CoherenceModel(topics=curr_topics, texts=word_lists, dictionary=dict, corpus=corpus, coherence='c_v')
            curr_coherence = round(cm.get_coherence(), 5)

            print('(', i, ',', curr_coherence, '),')
            if (curr_coherence > best_coherence): 
                best_num_topics = i 
                best_coherence = curr_coherence 

        


        print("[websiteTopicModel approximate_best_n] best number of components: ", best_num_topics) 
        self.nmf_model = NMF(n_components=best_num_topics, random_state=60, solver='mu', init='nndsvda')
        self.W = self.nmf_model.fit_transform(self.tfidf_matrix)
        self.H = self.nmf_model.components_  


    def get_topics(self): 
        topics = [] 
        word_topics = [] 
        terms = self.vectorizer.get_feature_names_out()
        for index, topic in enumerate(self.H):
            topics.append([terms[i] for i in topic.argsort()[-10:]])
        for topic in topics: 
            word_topics.append([word for phrase in topic for word in phrase.split()])  
        return word_topics 

    def map_topics_to_websites(self, urls): 
        self.topic_doc_map = {i: [] for i in range(self.nmf_model.n_components)}

        for doc_index, topic_scores in enumerate(self.W): 
            max_topic_score = np.argmax(topic_scores)
            self.topic_doc_map[max_topic_score].append(urls[doc_index])
        
        print("[websiteTopicModel map_topics_to_websites] get_topics", self.topic_doc_map)
        return self.topic_doc_map


    
    async def driver(self, data, urls):
        self.read_txt(website_data=data)
        self.create_tfidf_matrix()
        self.generate_nmf_model()

        return self.map_topics_to_websites(urls)

    



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


async def init_punkt(data): 
    unpacked = json.loads(data)
    url = unpacked['punkturl']
    print("in init_punkt")
    response = await fetch(url)
    js_buffer = await response.arrayBuffer()
    py_buff = js_buffer.to_py() 
    stream = py_buff.tobytes()
    d = Path("/nltk_data/tokenizers")
    d.mkdir(parents=True, exist_ok=True)
    Path('/nltk_data/tokenizers/punkt.zip').write_bytes(stream)
    zipfile.ZipFile('/nltk_data/tokenizers/punkt.zip').extractall(path='/nltk_data/tokenizers/') 
    print(os.listdir("/nltk_data/tokenizers/punkt"))

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
async def cluster(data): 
    global url_id_map
    global nmf_model 
    unpacked = json.loads(data)
    numWindows = unpacked['numWindows']
    print("website data read text: ", website_data.shape[0])
    print("in cluster")
    topics_website_ids_map = {}
    print("\n==========================================APP.PY URL TO ID====================================\n")
    print(url_id_map)
    print("\n==========================================APP.PY URL TO ID ====================================\n")
    print("in cluster!!!\n")
    if nmf_model is None: 
        nmf_model = websiteTopicModel(n_components=numWindows) 
        topic_doc_map = await nmf_model.driver(website_data, urls) 
    else: 
        topic_doc_map = await nmf_model.recluster(new_components=numWindows, data=website_data, urls=urls)
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

        json_st = json.dumps({'topics': topics_website_ids_map}) 
        return json_st 
    else: 
        return "something went wrong."


