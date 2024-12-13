const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config();



const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: 'ap-northeast-2'
});

const fileFilter = (req, file, cb) => {
    const Types = ['image/jpeg', 'image/png'];

    if (Types.includes(file.mimetype)) {
        return cb(null, true);
    }

    req.imageUploadFail = "이미지가 아닙니다."
    return cb(null, false);
}

exports.imageUpload = multer({
    storage : multerS3({
        s3,
        bucket: process.env.AWS_S3_BUCKET,
        key: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const {id} = req.user;
            cb(null, `[user_id: ${id} - ${file.fieldname}]`+ Date.now() + ext);
        }
    }),
    fileFilter : fileFilter
});

// 수정 시 전 사진 삭제
exports.imageDelete = async (key) => {
    try {
        const checkObj = new ListObjectsV2Command({
            Bucket: process.env.AWS_S3_BUCKET,
            Prefix: key
        });

        const date = await s3.send(checkObj);
        
        if (date.KeyCount > 1) {
            const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: date.Contents[0].Key
        });
            await s3.send(deleteCommand);
        }
        return date;
    } catch (err) {
        console.error(err);
    }
}

