import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

export const s3 = new S3Client({
	region: "auto",
	endpoint: process.env.S3_API_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY_ID,
	},
});

// // Upload a file
// await s3.send(
// 	new PutObjectCommand({
// 		Bucket: "kettou",
// 		Key: "myfile.txt",
// 		Body: "Hello, R2!",
// 	}),
// );
// console.log("Uploaded myfile.txt");

// // Download a file
// const response = await s3.send(
// 	new GetObjectCommand({
// 		Bucket: "kettou",
// 		Key: "myfile.txt",
// 	}),
// );
// const content = await response.Body.transformToString();
// console.log("Downloaded:", content);

// // List objects
// const list = await s3.send(
// 	new ListObjectsV2Command({
// 		Bucket: "kettou",
// 	}),
// );
// console.log(
// 	"Objects:",
// 	list.Contents.map((obj) => obj.Key),
// );
