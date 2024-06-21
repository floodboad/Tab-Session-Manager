import axios from "axios";
import log from "loglevel";
import { refreshAccessToken } from "./cloudAuth";
import { sliceTextByBytes } from "../common/sliceTextByBytes";

const logDir = "background/cloudAPIs";

export const listFiles = async (pageToken = "") => {
  log.log(logDir, "listFiles()");
  const accessToken = await refreshAccessToken();
  const options = {
    method: "get",
    url: "https://www.googleapis.com/drive/v3/files",
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      spaces: "appDataFolder",
      fields: [
        "files/id",
        "files/name",
        "files/appProperties/lastEditedTime",
        "files/appProperties/tag",
        "nextPageToken"
      ].join(","),
      pageSize: 1000,
      pageToken: pageToken
    }
  };

  const result = await axios(options).catch(e => {
    log.error(logDir, "listFiles()", e.response);
  });

  let files = result.data.files;
  if (result.data.nextPageToken) files = files.concat(await listFiles(result.data.nextPageToken));
  files = files.map(file => {
    file.appProperties.tag = file.appProperties?.tag?.split(",") || [];
    return file;
  });
  log.log(logDir, "=>listFiles()", files);
  return files;
};

export const uploadSession = async (session, fileId = "") => {
  log.log(logDir, "uploadSession()", session, fileId);
  const metadata = {
    name: session.id,
    appProperties: {
      id: session.id,
      name: sliceTextByBytes(session.name, 115), // limited 124bytes
      date: session.date,
      lastEditedTime: session.lastEditedTime,
      tag: sliceTextByBytes(session.tag.join(","), 115),
      tabsNumber: session.tabsNumber,
      windowsNumber: session.windowsNumber
    },
    mimeType: "application/json"
  };
  if (!fileId) metadata.parents = ["appDataFolder"];
  const file = new Blob([JSON.stringify(session)], { type: "application/json" });
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  // var reader = new FileReader();
  // reader.readAsDataURL(file);
  // let content64 = reader.result;
  // console.log('---------->content64:', content64);
  // form.append("file", content64);

  // let content64 =  fileByBase64(file, (base64) => {
  //   return  base64;
  // })

  let content64 = await fileToBase64(file);
  console.log('---------->content64:', content64);
  let mesg = JSON.stringify(metadata);
  console.log('---------->mesg:', mesg);

  // const buffer = Buffer.from(form, 'binary');
  // const base64 = buffer.toString('base64');
  // console.log('---------->base64:', base64);

  // let fblob = new Blob([form], { type: file.type });
  // var reader = new FileReader();
  // reader.readAsDataURL(form);
  // let content64 = reader.result;
  // let base64Data  = "";
  // // 转换form-data为base64
  // form.getBuffer().then(buffer => {
  //   base64Data = buffer.toString('base64');
  //   // console.log('-------->base64Data',);
  // });
  //
  // console.log('---------->base64Data:', base64Data);
  console.log('---------->7777777777777777777');
  let blobbody  = {
    "access_token": "5b6296905da67e9c4568afe2846fb9de",
    "content": content64,
    "message": mesg
  };

  console.log('---------->blobbody:', blobbody);

  // const myHeaders = new Headers();
  // myHeaders.append("Content-Type", "text/xml");

  // const accessToken = await refreshAccessToken();
  const init = {
    method: fileId ? "PUT" : "POST",
    // headers: new Headers({ Authorization: "Bearer " + accessToken }),
    headers: new Headers({"Content-Type": "application/json;charset=UTF-8"}),
    body: JSON.stringify(blobbody)
  };
  // const url = `https://www.googleapis.com/upload/drive/v3/files${fileId ? `/${fileId}` : ""}?uploadType=multipart`;
  // const url =  `https://gitee.com/api/v5/repos/cubemagic/mytabsessions/contents${fileId ? `/${fileId}` : ""}`;
  let tmpfileId = fileId ? fileId : session.id;
  // const url =  `https://gitee.com/api/v5/repos/cubemagic/mytabsessions/contents${`/${tmpfileId}`}`;
  const url =  `https://gitee.com/api/v5/repos/cubemagic/mytabsessions/contents${`/${tmpfileId}.json`}`;

  const result = await fetch(url, init).catch(e => {
    console.log('--------->create error : ',e);
    log.error(logDir, "uploadSession()", e);
  });
  const resultJson = await result.json();
  if (resultJson.error) log.error(logDir, "uploadSession()", resultJson);
  log.log(logDir, "=>uploadSession()", resultJson);
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    // 创建一个新的 FileReader 对象
    const reader = new FileReader();
    // 读取 File 对象
    reader.readAsDataURL(file);
    // 加载完成后
    reader.onload = function (e) {
      // 将读取的数据转换为 base64 编码的字符串
      // const base64String = reader.result.split(",")[1];
      const base64String = e.target.result;
      // 解析为 Promise 对象，并返回 base64 编码的字符串
      resolve(base64String);
    };

    // 加载失败时
    reader.onerror = function () {
      reject(new Error("Failed to load file"));
    };
  });
}

/**
 * 上传附件转base64
 * @param {File} file 文件流
 */
export const fileByBase64 = (file, callback) => {
  var reader = new FileReader();
  // 传入一个参数对象即可得到基于该参数对象的文本内容
  reader.readAsDataURL(file);
  reader.onload = function (e) {
    // target.result 该属性表示目标对象的DataURL
    console.log(e.target.result);
    callback(e.target.result)
  };
}

export const downloadFile = async fileId => {
  log.log(logDir, "downloadFile()", fileId);
  const accessToken = await refreshAccessToken();
  const options = {
    method: "get",
    url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { alt: "media" }
  };

  const result = await axios(options).catch(e => {
    log.error(logDir, "downloadFile", e.response);
  });

  log.log(logDir, "=>downloadFile()", result.data);
  return result.data;
};

export const deleteAllFiles = async () => {
  log.log(logDir, "deleteAllFiles()");
  const files = await listFiles();
  for (let file of files) {
    await deleteFile(file.id);
  }
};

export const deleteFile = async fileId => {
  log.log(logDir, "deleteFiles()", fileId);
  const accessToken = await refreshAccessToken();
  const options = {
    method: "delete",
    url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
    headers: { Authorization: `Bearer ${accessToken}` }
  };

  await axios(options).catch(e => {
    log.error(logDir, "deleteFiles()", e.response);
  });
};
