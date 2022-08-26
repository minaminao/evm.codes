import fs from 'fs'
import path from 'path'

import React, { useContext } from 'react'

import matter from 'gray-matter'
import type { NextPage } from 'next'
import { serialize } from 'next-mdx-remote/serialize'
import getConfig from 'next/config'
import Head from 'next/head'
import { IItemDocs, IGasDocs, IDocMeta } from 'types'

import { EthereumContext } from 'context/ethereumContext'

import ContributeBox from 'components/ContributeBox'
import HomeLayout from 'components/layouts/Home'
import ReferenceTable from 'components/Reference'
import { H1, H2, Container, RelativeLink as Link } from 'components/ui'

const { serverRuntimeConfig } = getConfig()

// It seems the memory expansion computation and constants did not change since frontier, but we have to keep an eye on new fork to keep this up to date
const PrecompiledPage = ({
  precompiledDocs,
  gasDocs,
}: {
  precompiledDocs: IItemDocs
  gasDocs: IGasDocs
}) => {
  const { precompiled } = useContext(EthereumContext)

  return (
    <>
      <html lang="en"></html>
      <React.Fragment>
        <Head>
          <title> EVM Codes - Precompiled Contracts </title>
          <h1>
            EVM Codes offers a reference of precompiled contracts - complex
            client-side functions bundled with the Ethereum Virtual Machine for
            efficiency.
          </h1>
        </Head>
      </React.Fragment>
      <Container className="text-sm leading-6">
        <H1>プリコンパイル済みコントラクト</H1>

        <H2 className="mb-4">イントロダクション</H2>
        <p className="pb-6">
          EVMは、一連のオペコードに加え、プリコンパイル済みコントラクトによって、より高度な機能を提供します。
          これは、固定アドレスでEVMにバンドルされ、決められたガスコストで呼び出すことができる特殊なコントラクトです。
          アドレスは1から始まり、コントラクトごとにインクリメントされます。
          新しいハードフォークでは、新しいプリコンパイル済みコントラクトが導入される可能性があります。
          これらは、通常のコントラクトでの
          <Link to="#F1" title="CALL" />
          命令のようにオペコードで呼び出されます。
          ここで言うガスコストは純粋にコントラクトのコストであり、コール自体のコストやパラメータをメモリに置くための命令は考慮されていません。
          また、プリコンパイルされたコントラクトは
          <Link to="playground" title="playground" />
          で利用可能です。
        </p>
        <p className="pb-6">
          すべてのプリコンパイル済みコントラクトにおいて、入力が期待されるより短い場合は、末尾にゼロを付加した仮想的なパディングがあると見なされます。
          入力が予想より長い場合は、末尾の余分なバイトは無視されます。
        </p>
        <p className="pb-6">
          ハードフォーク<b>Berlin</b>
          の後、すべてのプリコンパイル済みコントラクトのアドレスは、常に「ウォーム」とみなされます。セクション
          <Link to="about" title="access sets" />
          を参照してください。
        </p>
      </Container>

      <section className="py-10 md:py-20 bg-gray-50 dark:bg-black-700">
        <Container>
          <ReferenceTable
            isPrecompiled
            reference={precompiled}
            itemDocs={precompiledDocs}
            gasDocs={gasDocs}
          />
        </Container>
      </section>

      <section className="pt-20 pb-10 text-center">
        <ContributeBox />
      </section>
    </>
  )
}

PrecompiledPage.getLayout = function getLayout(page: NextPage) {
  return <HomeLayout>{page}</HomeLayout>
}

export const getStaticProps = async () => {
  const docsPath = path.join(serverRuntimeConfig.APP_ROOT, 'docs/precompiled')
  const docs = fs.readdirSync(docsPath)

  const precompiledDocs: IItemDocs = {}
  const gasDocs: IGasDocs = {}

  await Promise.all(
    docs.map(async (doc) => {
      const stat = fs.statSync(path.join(docsPath, doc))
      const address = path.parse(doc).name.toLowerCase()

      try {
        if (stat?.isDirectory()) {
          fs.readdirSync(path.join(docsPath, doc)).map((fileName) => {
            const markdown = fs.readFileSync(
              path.join(docsPath, doc, fileName),
              'utf-8',
            )
            const forkName = path.parse(fileName).name
            if (!(address in gasDocs)) {
              gasDocs[address] = {}
            }
            gasDocs[address][forkName] = markdown
          })
        } else {
          const markdownWithMeta = fs.readFileSync(
            path.join(docsPath, doc),
            'utf-8',
          )
          const { data, content } = matter(markdownWithMeta)
          const meta = data as IDocMeta
          const mdxSource = await serialize(content)

          precompiledDocs[address] = {
            meta,
            mdxSource,
          }
        }
      } catch (error) {
        console.debug("Couldn't read the Markdown doc for the opcode", error)
      }
    }),
  )
  return {
    props: {
      precompiledDocs,
      gasDocs,
    },
  }
}

export default PrecompiledPage
