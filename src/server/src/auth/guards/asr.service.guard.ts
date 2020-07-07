import { CanActivate, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderDto } from 'orders/dtos/orders.dto';
import { Repository } from 'typeorm';
import { Utils } from 'utils';
import { CONSTANTS } from '../../common/constant';
import { TokenDto } from 'tokens/dtos/tokens.dto';
import { TokenTypeDto } from 'tokens/dtos/token-types.dto';

@Injectable()
export class AsrServiceGuard implements CanActivate {
    constructor(
        @InjectRepository(OrderDto)
        private readonly orderRepo: Repository<OrderDto>,
        @InjectRepository(TokenDto)
        private readonly tokenRepo: Repository<TokenDto>,
        @InjectRepository(TokenTypeDto)
        private readonly tokenTypeRepo: Repository<TokenTypeDto>,
    ) {
    }

    async canActivate(context: import('@nestjs/common').ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const token = Utils.extractToken(request);
        // const order = await this.orderRepo.findOne({
        //     where: {
        //         'token.value': token
        //     }
        // })
        // if (order && CONSTANTS.STATUS.SUCCESS === order.status) return true;
        // if (!order) {
        const tokenDto = await this.tokenRepo.findOne({value: token});
        // if (tokenDto.tokenType === CONSTANTS.TOKEN_TYPE.FREE) return true;
        if (tokenDto) return true;
        // }
        Logger.warn('User does not have permission to call AsrService.', 'AsrServiceGuard');
        return false;
    }
}
