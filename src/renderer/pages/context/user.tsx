import React, { useContext } from 'react';

export const UserContext = React.createContext<
  Pick<I.Jianguoyun.User, 'sandboxes' | 'userName' | 'nickName'>
>({
  sandboxes: [],
  userName: '', // 用户邮箱
  nickName: '',
});

export const useUserInfo = () => {
  return useContext(UserContext);
};
