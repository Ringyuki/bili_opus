import { request } from '../helpers/request';
import { BiliResponse } from '../interfaces/bili-response.interface';
import { OpusResponse } from '../interfaces/opus-response.interface';

export const fetchOpus = async (opusId: string): Promise<BiliResponse<OpusResponse>> => {
  const req = await request<BiliResponse<OpusResponse>>(`https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/detail?id=${opusId}&features=onlyfansVote,onlyfansAssetsV2,decorationCard,htmlNewStyle,ugcDelete,editable,opusPrivateVisible,tribeeEdit,avatarAutoTheme,avatarTypeOpus`)
  return req.get();
};