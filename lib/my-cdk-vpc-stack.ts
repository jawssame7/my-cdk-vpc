import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import {
  Vpc,
  SubnetType,
  SecurityGroup,
  Peer,
  Port,
} from "aws-cdk-lib/aws-ec2";
import * as dotenv from "dotenv";

dotenv.config();

export class MyCdkVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'MyCdkVpcQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const vpcName = process.env.VPC_NAME;

    if (!vpcName) {
      throw new Error("VPC_NAME is required in .env file");
    }

    // Create a new VPC with public and private subnets
    const myVpc = new Vpc(this, vpcName, {
      maxAzs: 3, // 使用するAZ（アベイラビリティゾーン）の最大数
      cidr: "10.0.0.0/16", // VPCのCIDRブロック
      subnetConfiguration: [
        {
          cidrMask: 24, // 各サブネットのCIDRサイズ
          name: "PublicSubnet",
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24, // 各サブネットのCIDRサイズ
          name: "PrivateSubnet",
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1, // NATゲートウェイの数
    });

    // VPC IDを出力
    new cdk.CfnOutput(this, "VpcId", {
      value: myVpc.vpcId,
    });

    const sgName = process.env.PUBLIC_SECURITY_GROUP_NAME;

    if (!sgName) {
      throw new Error("PUBLIC_SECURITY_GROUP_NAME is required in .env file");
    }

    // セキュリティグループを作成
    const publicSg = new SecurityGroup(this, sgName, {
      vpc: myVpc,
      description: "Allow SSH and HTTP access",
      allowAllOutbound: true, // すべてのトラフィックを許可
    });

    // インバウンドルールを追加
    publicSg.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      "Allow SSH access from the world"
    );
    publicSg.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      "Allow HTTP access from the world"
    );

    const privateSgName = process.env.PRIVATE_SECURITY_GROUP_NAME;

    if (!privateSgName) {
      throw new Error("PRIVATE_SECURITY_GROUP_NAME is required in .env file");
    }

    // セキュリティグループを作成
    const privateSg = new SecurityGroup(this, privateSgName, {
      vpc: myVpc,
      description: "Allow SSH access",
      allowAllOutbound: true, // すべてのトラフィックを許可
    });

    // インバウンドルールを追加
    privateSg.addIngressRule(
      publicSg,
      Port.tcp(22),
      "Allow SSH access from the public security group"
    );
  }
}
