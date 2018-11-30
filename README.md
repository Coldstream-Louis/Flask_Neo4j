# Flask_Neo4j
<<<<<<< HEAD
#KG-Vis

##后端运行方法
```
cd yourPath/flask_test
pip install -r requirements.txt
virtualenv venv
source venv/bin/activate
export NEO4J_PASSWORD=abc123456
python run.py
```
然后服务就会部署到localhost:8000上
不过由于除了graph为get外，大部分接口都是post形式，所以浏览器无法直接访问，请参考接口文档中的数据格式在前端写请求访问，或利用postman等工具模拟发送请求。
根据新增的节点类型重写了所有的接口，拓展了原来的部分功能，代码注释中写明了每个接口的功能
目前所有接口都经过了测试，跨域头已经添加，可以直接在前端写请求访问。

##前端运行方法
位于force-vis文件夹，运行方法如下
```
cd yourPath/force-vis
npm install
npm run dev
```
注意我写的请求直接用的json格式，所以需要使用Chrome浏览器的一个插件Allow Control Allow Origin，下载后请添加上所有接口的url在list上，这样才能确保可以请求到后端的数据

##9.7更新
添加了前端API的请求部分并且为后面个部分的整合预先写好了部分逻辑

##9.9更新
与Liu Cong的第一版UI整合完毕，可以自由切换各个图谱，但现在使用的是暴力清除canvas画布的方法更新，而不是动态更新数据，所以需要等待d3初始的动画完全结束（节点完全静止的时候，大概等5秒吧）才可以点击切换其他图谱。后续可能会发布新的动态更新的版本修复这个问题。
=======
Back End For CHI
>>>>>>> 0e6ebf4627830eaed7418022b4df4610391fdc08
