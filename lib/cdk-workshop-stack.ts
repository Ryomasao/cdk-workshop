import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'

export class CdkWorkshopStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
			// 実行するfunctionのファイル名かな。このリポジトリのlambdaディレクトリにあたる
      code: lambda.Code.fromAsset('lambda'),
			// lambdaディレクトリのhelloモジュールのhandlerを実行するってことかな
      handler: 'hello.handler'
    })
  }
}
