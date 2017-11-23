var Vimeo = require('vimeo').Vimeo;

/**
 * Vimeo Adapter 
 * @class
 */
class Adapter{
  constructor(client){
    this.client = client;
    this.options = {
      clientId      : client.options.clientId,
      clientSecret  : client.options.clientSecret,
      accessToken   : client.options.accessToken
    }
    this.srv = new Vimeo(this.options.clientId, this.options.clientSecret, this.options.accessToken);
    // this.srv = new FB.Facebook(this.options);
  }

  post(post){
    return new Promise((resolve,reject)=>{
      let viewPrivacy = post.private == true ? "nobody": "anybody";

      let promise;
      if(post.file){
        promise = streamUpload(this.srv, post.file.path, (upload_size, file_size) => {
          // progress callback
          // console.log("You have uploaded " + Math.round((upload_size/file_size) * 100) + "% of the video");
        })
      }else{
        promise = postVideoLink(this.srv, post.link);
      }

      promise
      .then(video => {
        return editVideo(this.srv, video, {title: post.title, description: post.message, viewPrivacy: viewPrivacy})
      })
      .then(resolve)
      .catch(reject);
  
    })
  }

}

/*
 Sube un archivo a través de streaming.
 lib : instancia de vimeo
 filePath: ubicación del archivo.
 progressCB: Callback de progreso de subida. (uploadedSize, totalSize) => {}
 */
function streamUpload(lib, filePath, progressCB){
  return new Promise((resolve, reject) =>{
    lib.streamingUpload(filePath,  function (error, body, status_code, headers) {
      if (error) {
        reject(error)
      }else{
        lib.request(headers.location, function (error, body, status_code, headers) {  
          if(error){
            reject(error)
          }else{
            resolve({uri: body.uri, url: body.link});
          }
        });
      }
    }, progressCB);
  });
}

/*
 Sube a vimeo un archivo ubicado en una url.
 */
function postVideoLink(lib, link){
  return new Promise((resolve, reject) =>{
    lib.request({method: "POST", path: "/me/videos", query: {type: "pull", link: link}}, function (error, body, status_code, headers){
      if (error) {
        reject(error)
      }else{    
        resolve({uri: body.uri, url: body.link});
      }
    });
  });
}

function editVideo(lib, video, options){
  return new Promise((resolve, reject) =>{
    lib.request({method:'PATCH', path:video.uri, query:{name:options.title, description: options.description, privacy: {view: options.viewPrivacy}}}, function (error, body, status_code, headers) {
      if(error){
        console.log(error);
        reject(error);
      }else{
        console.log(body);
        console.log("Video options edited");
        resolve(video);
      }
    });
  });
}

module.exports = Adapter;


