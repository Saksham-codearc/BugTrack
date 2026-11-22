const fs = require('fs/promises');
const path = require('path');
const { uploadRoot } = require('../middleware/upload');

const removeAttachmentFiles = async (attachments = []) => {
  await Promise.all(
    attachments.map((attachment) =>
      fs.unlink(path.join(uploadRoot, attachment.filename)).catch(() => {
        // The file may already have been removed manually; that is fine.
      })
    )
  );
};

module.exports = { removeAttachmentFiles };
