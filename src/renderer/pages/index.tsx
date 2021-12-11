import { useRequest } from 'ahooks';
import { Button, Layout, Spin } from 'antd';
import { getCurrentUser } from '../service/api';
import { useState } from 'react';
import Login from './components/Login';
import Recover from './components/Recover';
import { UserContext } from './context/user';
import './index.css';
import { AxiosError } from 'axios';

const { Header, Footer, Content } = Layout;

export default () => {
  const [showLogin, setShowLogin] = useState(false);

  const { data, loading, refresh } = useRequest(() => {
    return getCurrentUser().catch((e) => {
      if ('response' in e) {
        const { response } = e as AxiosError<{
          detailMsg: string;
          errorCode: string;
        }>;
        if (
          response?.data.errorCode === 'UnAuthorized' ||
          response?.data.errorCode === 'IllegalArgument'
        ) {
          // 需要登录
          setShowLogin(true);
          return undefined;
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    });
  });
  return (
    <div>
      <Login
        visible={showLogin}
        hide={() => {
          setShowLogin(false);
          refresh();
        }}
      />
      <Layout style={{ background: 'none' }}>
        <Header style={{ background: '#f0f2f5' }}>
          <span
            style={{
              display: 'inline-flex',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <span>坚果云文件恢复助手</span>
            <span>
              {data?.userName}{' '}
              <Button size="small" onClick={() => setShowLogin(true)}>
                切换账号
              </Button>
            </span>
          </span>
        </Header>
        {data && (
          <UserContext.Provider value={data}>
            <Content className="container">
              <Spin spinning={loading} tip="登录中">
                <Recover sndboxes={data?.sandboxes} />
              </Spin>
            </Content>
          </UserContext.Provider>
        )}
        <Footer style={{ background: 'none' }}>
          <a href="https://github.com/cloverstd" target="_blank">
            github.com/cloverstd
          </a>
        </Footer>
      </Layout>
    </div>
  );
};
