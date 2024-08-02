from setuptools import setup, find_packages

setup(
    name='tabcluster',
    version='0.1.0',
    description='',
    author='Nuha Rahman',
    author_email='nrahm777@gmail.com',
    package_dir= {"": "tabcluster"}, 
    install_requires=[
        "pandas",  
        "nltk" , 
        "numpy" ,
        "scikit-learn",
        "gensim", 
        "js"
        
    ],
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
)
