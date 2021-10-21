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

横道。

[こちら](https://awsjp.com/AWS/hikaku/API_Gateway-Lambda-chigai.html)を参考にさせていただいた。

あー、Lamda がそのままREST APIのエンドポイントとしては使えないから、API Gateway経由で呼ぶってことね。
# 戻る

ということでlambdaはそのまま使えないので、API Gatewayを定義する。


```ts
// 割愛
import * as apigw from '@aws-cdk/aws-apigateway';
// 割愛
    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: hello
    })
```

デプロイするとエンドポイントが表示されてcurlで確認できた。

これ以降の特記事項はそんなにないかも。

- DynamoDBつくってLambdaから更新してみた。またLambdaから別のLambda関数を実行したりしてみた。  
- 上記を行うにあたって、LambdaにDynamoDBを参照するロールをアタッチしたりするのも、cdk内で完結できる。  
- npmモジュールとして、インフラ定義がセットになったパッケージを配布ができるるってこともなんとなくわかった。  
- とはいえ、実際にどんなインフラ構成で何が追加されているのか理解する必要がある。  

あとかたづけ

```
cdk destroy
```
# CodePipeline

やったことはこのcommit参照。
`cb70f26cd736c54153bef9759459d2bdc9c55846`

CDKがpipelineを利用できるように、adminのポリシーをcdkにアタッチしてるのかな

code pipelineについては[この図](https://docs.aws.amazon.com/ja_jp/codepipeline/latest/userguide/welcome-introducing.html)がシンプルでイメージしやすかった。
用語については、[ここ](https://docs.aws.amazon.com/ja_jp/codepipeline/latest/userguide/concepts.html)

よく出てくるのは、Stage/Actions/Artifactsあたり。  
Jenkinsと似たように、Stageの中にいくつかのActionsがあるって感じ。Artifactsはピンときてないけどソースコードやファイル、アプリケーションとかざっくりとしたデータの集合を表す用語。  

```
npx cdk bootstrap --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

デプロイに、AWS CodeCommitを利用するので、IAMでCodeCommit用の認証情報を作成しておく。
リポジトリができてるので、このリポジトリをCodeCommitのremoteと紐付けておく。

```sh
git remote add codecommit codecommitのリーモトリポジトリのURL
# usernameとpasswordが聞かれるのでさきほど作成した認証情報の値を入力
git push codecommit main
```


# CodePipelineを通してcdkのスタックをデプロイする

むむ。ちょっとよくわからなくなってきたやつ。  
今ままでは、`cdk deploy`することでインフラ/アプリケーションコードをデプロイしてきた。  
Pipelineを利用することで、リポジトリに変更があった場合、自動的にPipelineが`cdk deploy`を実行してくれる流れになるんだと思う。  

初回はpipelineそのものを構築するためにpipeline定義をして`cdk deploy`して、以降はpipelineから実行みたいなかんじかしら。

このへんのcommitでpipeline stageを追加してる。  
`28ed3336ce40e24eaf96288dc0ba1cae771f536a`

チュートリアルで作成したpipelineをAWSのconsoleでみてみると以下のステージで構成されていることが確認できる。  

基本は、Source/Build/Deployの3ステージから構成されるって思っておけばよさげ。

- Source
- Build
- UpdatePipeline
- Assets
- Deploy

## Source

AWS CodeCommitからソースコードを取得してくるだけ。
対象のブランチとかって、どこで指定するんだろう。  
→ ステージの編集からアクションを編集できて、その中にブランチもあった。
→ inputとなるリポジトリの設定もある。
→ 出力Artifactなる設定があって、次のStageにわたす成果物もここでしてた。

## Build

SourceStageで出力したartifactをinputにしてソースをビルドして、新たなartifactを生成する。

ビルドは、AWS CodeBuildがまた別でいて、Buildステージでは、AWS CodeBuild側で利用するプロジェクトを選択する流れになる。  

## UpdatePipeline

pipelineがpipeline/インフラをアップデートしてる。  
やってる内容は、`cdk deploy`


## Assets

これがいまいちわからない。  

[こちらの記事](https://dev.classmethod.jp/articles/aws-cdk-unit-test-ignore-assets/)や公式docを参照するに、cdkのアプリケーションにバンドルするファイルっぽい。  

## Deploy

CloudFormationを呼び出してる。  
こっから先はCloudFormationがわかってないと理解できないかも。


これでCloudFormationのテンプレートが生成されるので、別の機会にCloudFormationだけでためしてみよう。

```
ckd synth
```


