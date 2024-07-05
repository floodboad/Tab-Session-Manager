
class CloudSyncStrategy {
  syncData(data) {
    throw new Error('SyncStrategy is an abstract class');
  }

  listFiles = async (pageToken = "") => {

    throw new Error('SyncStrategy is an abstract class');
    };


  uploadSession = async (session, fileId = "") => {
    throw new Error('SyncStrategy is an abstract class');
  };

  downloadFile = async fileId => {
    throw new Error('SyncStrategy is an abstract class');
  };

  deleteAllFiles = async () => {
    throw new Error('SyncStrategy is an abstract class');
  };

  deleteFile = async fileId => {
    throw new Error('SyncStrategy is an abstract class');
  };


}

export default CloudSyncStrategy;