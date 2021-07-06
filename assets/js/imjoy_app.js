const overlayStyle = `
.overlay {
    height: 100%;
    width: 100%;
    display: none;
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0, 0.9);
  }
  
  .overlay-content {
    position: relative;
    top: 25%;
    width: 100%;
    text-align: center;
    margin-top: 30px;
  }
  
  .overlay a {
    padding: 8px;
    text-decoration: none;
    font-size: 36px;
    color: #818181;
    display: block;
    transition: 0.3s;
  }
  
  .overlay a:hover, .overlay a:focus {
    color: #f1f1f1;
  }
  
  .overlay .closebtn {
    position: absolute;
    top: 20px;
    right: 45px;
    font-size: 60px;
  }
  
  @media screen and (max-height: 450px) {
    .overlay a {font-size: 20px}
    .overlay .closebtn {
    font-size: 40px;
    top: 15px;
    right: 35px;
    }
  }
`

const containerId = 'imjoy-container';

window.startFishQuant = async function(appURL, pluginURL, binderSpec){
  const imjoyCore = await loadImJoyCore({version: '0.13.78'})
  const imjoy = new imjoyCore.ImJoy({})
  await imjoy.start()
  const api = imjoy.api;
  console.log('ImJoy Core started successfully!')
  const elm = document.getElementById(containerId);
  if(elm){
    elm.style.display = 'block';
  }
  else{
      // inject css style
      const styleSheet = document.createElement("style");
      styleSheet.innerText = overlayStyle;
      document.head.appendChild(styleSheet);

      // create overlay
      const container = document.createElement("div");
      container.id = containerId
      container.classList.add("overlay")
      // container.innerHTML = `<iframe style="width:100vw;height:100vh;" frameBorder="0" src="${url}"></iframe>`;
      container.style.display = 'block';
      document.body.appendChild(container);
      
  }
  document.getElementById('mainNav').style.display = 'none';
  // make sure we have #/app
  const hash = appURL.split('#')[1];
  if(!hash || !hash.includes('#/app')) appURL = appURL + '#/app';
  // make sure we expose the imjoy api
  const query = appURL.split('?')[1];
  if(!query || !query.includes('expose=1')) appURL = appURL + '?expose=1';
  const imjoyWindowAPI = await api.createWindow({src: appURL, window_id: containerId});
  let engineManager;
  try{
    engineManager = await imjoyWindowAPI.getPlugin("Jupyter-Engine-Manager")
  }
  catch(e){
    engineManager = await imjoyWindowAPI.getPlugin({src: "https://imjoy-team.github.io/jupyter-engine-manager/Jupyter-Engine-Manager.imjoy.html"})
  }
  try{
    await imjoyWindowAPI.loadPlugin({src: pluginURL})
  }
  catch(e){
    console.error(e)

    if(confirm("Failed to load the engine, would you like to try to run FISH-quant with the Binder plugin engine?")){
      await engineManager.createEngine({
        name: "MyBinderEngine",
        url: "https://mybinder.org",
        spec: binderSpec || "oeway/imjoy-binder-image/master",
      });
      await imjoyWindowAPI.loadPlugin({src: pluginURL})
    }
    else{
      const jupyterEngineFactor = (await imjoyWindowAPI.getServices({name: 'Jupyter-Engine'}))[0]
      await jupyterEngineFactor.addEngine()
      await imjoyWindowAPI.loadPlugin({src: pluginURL})
    }
  }
}