# hello cdk

なんだかよくわかってない。
AWSのInfra as Codeの立ち位置としてAWS CloudFormationがある。  
CloudFormationのコードをcdkを使うと生成してくれるっぽい。

ひとまずnpmパッケージで提供されてるので以下のverでインストール。

```
node -v
v14.18.0
npm install -g aws-cdk
```

# チュートリアル

https://cdkworkshop.com/20-typescript.html


基本はチュートリアルをみればいいので、気になった箇所だけメモする。

```
# これを実行すると、cloudformationのymlっぽいものがコンソールに出力される
cdk synth
```

```
# synthで表示した内容でインフラを構築するっぽい
cdk bootstrap
# ためしにs3のバケットをみてみると、新しいバケットが作成されていた。
# 他にもリソース追加されてそうだけど、cloudformation noobなので読み取れない && S3っぽい記載はなさげだったけど、他のサービスに付随して作られるのかな
aws ls s3
# → あー、bootstrapはs3だけ構築してるんじゃないか疑惑。実際のcloudformationのstack作成とかは、↓のcdk deployっぽい
```

```
# あー、こっちのコマンドを実行すると、AWSコンソールのcloudformationにstackなるものが作成されるのかも？
cdk deploy
```

cloudformationのymlのinputになってるのが、`xx-stack.ts`ってファイル。
このファイルにAWS Construct Libraryを利用することでAWSのサービスを定義することができるとのこと。

https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html


```ts
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
```

上記を定義をしたあとで、

```sh
cdk deploy
```

をすると、lambdaの関数がデプロイされてる。便利ね。

## API GatewayとLamda

[こちら](https://awsjp.com/AWS/hikaku/API_Gateway-Lambda-chigai.html)を参考にさせていただいた。

あー、Lamda がそのままREST APIのエンドポイントとしては使えないから、API Gateway経由で呼ぶってことね。