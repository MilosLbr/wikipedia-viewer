// working url "https://en.wikipedia.org/w/api.php?action=opensearch&search=+term+&format=json&callback=?"

window.onload = init;

let searchBtn, inputfield, ouputDiv, showObject;
let base_url = "https://en.wikipedia.org/w/api.php";  // base URL for mediawiki API

function init(){
    searchBtn = document.getElementById('search-button');

    inputfield = document.getElementById('search-input');

    outputDiv = document.getElementById('output');

    searchBtn.addEventListener('click', searchwiki);
 
}

function searchwiki(){
    outputDiv.innerHTML = '';

    let term = inputfield.value;

    let titleUrl = search_term(term);

    createWikiObject(titleUrl)   // makes the first ajax request and creates an object with title, description and url as properties
    .then(function(data){
        console.log(data,'passed in then');

        data.forEach(function(elem){
            addExtrctToObj(elem)    // first add extract text to each object in the array
            .then(function(inerdata){
                addImgUrlToObj(inerdata)  // then add main img to each object in array
                .then(function(inerdata){
                
                apendobject(inerdata);  // when all is done, apend object to the output div
            });
         });
        });
    
    });
}
 
function apendobject(obj){  

    let wikiLink = document.createElement('a');  // the whole data recieved from API will be stored as a link (display:block), so the user can click and go to the wikipedia page to view the whole article
    wikiLink.classList.add('wiki-link');
    wikiLink.setAttribute('href', obj['url']);
    wikiLink.setAttribute('target', '_blank');

    let wikiTitleDiv = document.createElement('div');
    wikiTitleDiv.classList.add('row');
    wikiTitleDiv.innerHTML = "<h4 class='text-center'>" + obj['title'].replace(/_/g, " ") + "</h4>";  // wikipedia Titles have _ instead of whitespace so this is replaced
    wikiLink.appendChild(wikiTitleDiv)

    let wikiResult = document.createElement('div');  // the extracted text and image will go here
    
    wikiResult.classList.add('wiki-result', 'row');

    if(obj['extract'] && obj['image-url']){
        // if wikipedia article has both the image and the extracted text we append both to the output div 

        let extractTextElem = document.createElement('div');
        extractTextElem.classList.add('col-lg-8', 'order-lg-0' , 'order-1');
        extractTextElem.style.alignSelf = 'center';

        extractTextElem.innerHTML = obj['extract'];

        let imageContainerDiv = document.createElement('div'); // container for the image
        imageContainerDiv.classList.add('col-lg-4', 'text-center', 'order-lg-1', 'order-0' , 'image-container');  

        imageContainerDiv.innerHTML = "<img class='img-fluid' alt='wiki image' src='" + obj['image-url'] + "'>";
        
        wikiResult.appendChild(extractTextElem);
        wikiResult.appendChild(imageContainerDiv);

        wikiLink.appendChild(wikiResult);

        outputDiv.appendChild(wikiLink);
    }else if(obj['extract']){
        // else if article doesn't have an image, only extract text is appended, and the text will consume the whole space of the div ==> no col-lg-8 class 

        let extractTextElem = document.createElement('div');

        extractTextElem.innerHTML = obj['extract'];
        extractTextElem.style.padding = '0px 15px 0px 15px';
        
        wikiResult.appendChild(extractTextElem);

        wikiLink.appendChild(wikiResult);

        outputDiv.appendChild(wikiLink);
    }
    
    // console.log(wikiLink);

    
}

function createWikiObject(titleUrl){
    return $.ajax({
        type: "GET",
        url:  titleUrl,
        dataType : 'jsonp',
        async: true,
        error : function(ermsg){
            console.log('error in searching',ermsg)
        },}).then(function(data){
        console.log(data, ' data in createWikiObj')

        let searchTermObjects =[];  // for every search term result an object will be created containing title of the search results for search term, description and url to the full wikipedia article. objects are stored in this array.

        for(let i = 0; i < data[1].length; i ++){
            searchTermObjects.push({
                'title': data[1][i].replace(/\s+/g, '_'),   // Title of the article. Whitespace is replaced with _ so it can be used for later API requests
                'description': data[2][i],  // Wikipedia description of a term
                'url': data[3][i],  // URL to the whole article
            })
            };

            let y = searchTermObjects;

            return new Promise((resolve,reject) =>{
                resolve(y);
            })
        }
    );  
}

function addExtrctToObj(obj){
    return $.ajax({
                type: "GET",
                url:  get_text(obj['title']),
                dataType : 'jsonp',
                async: true,
                error : function(ermsg){
                    console.log('error getting text',ermsg)
                }
            }).then(function (data){
                    let pageID = Object.keys(data.query.pages);

                    if(data.query.pages[pageID].hasOwnProperty('extract')){
                        /* console.log('geting text data', data.query.pages[pageID].extract); */
                        
                        obj['extract'] = data.query.pages[pageID].extract;  // adding new property extract to the object. Extract is extracted text from wikipedia article

                    }
                    return new Promise((resolve,reject) => {
                        resolve(obj);
                    });
                });
};


function addImgUrlToObj(obj){
    return $.ajax({
        type: "GET",
        url:  get_images(obj['title']),
        dataType : 'jsonp',
        async: true,
        error : function(ermsg){
            console.log('error getting images',ermsg)
        }}).then(function (data){
            let pageID = Object.keys(data.query.pages);
            
            if(data.query.pages[pageID].hasOwnProperty('original')  ){
                /* console.log(data.query.pages[pageID].original.source,'image for ', obj['title']); */
                
                obj['image-url'] = data.query.pages[pageID].original.source;  // adding new property image-url to the object. The value is URL to the main image of wikipedia article
               
            }
            return new Promise((resolve,reject) =>{
                resolve(obj);
            });
        });
        
};



function search_term(term) {
    let request_url = base_url + "?action=opensearch&search=" + term + "&format=json&callback=?";  // open search request for the given term
    
    return request_url;
}

function get_images(term){
    let request_url = base_url + "?action=query&prop=pageimages&piprop=original&format=json&titles=" + term;  // get main image for the given term
    // titles = fooo|bar|page

    return request_url;
}

function get_text(term){
    // get main text for the given article. term is title for the article where whitespaces are replaced with underscore _ ;
    let request_url = base_url + "?action=query&prop=extracts&exintro=&format=json&titles=" + term;  // explaintex=  returns plaintext, if ommited returns html

    return request_url;
}