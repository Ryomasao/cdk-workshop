import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'
import * as apigw from '@aws-cdk/aws-apigateway';
import { TableViewer } from 'cdk-dynamo-table-viewer';
import { HitCounter } from './hitcounter'

export class CdkWorkshopStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
			// 実行するfunctionのファイル名かな。このリポジトリのlambdaディレクトリにあたる
      code: lambda.Code.fromAsset('lambda'),
			// lambdaディレクトリのhelloモジュールのhandlerを実行するってことかな
      handler: 'hello.handler'
    })

    const helloWithCounter = new HitCounter(this, 'HelloHitCounter', {
      downstream: hello
    })

    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: helloWithCounter.handler
    })

    new TableViewer(this, 'ViewHitCounter', {
      title: 'Hello Hits',
      table: helloWithCounter.table
    })
  }
}
