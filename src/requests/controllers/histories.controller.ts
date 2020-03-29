import { Controller, UseGuards, Get, Query, Param, Req, ForbiddenException } from "@nestjs/common"; import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"; import { AuthGuard } from "@nestjs/passport"; import { CONSTANTS } from "common/constant";
import { InjectRepository } from "@nestjs/typeorm";
import { TokenDto } from "tokens/dtos/tokens.dto";
import { RequestService } from "requests/services/request.service";
import { FindRequestsQuery } from "requests/queries/impl/find-requests.query";
import { FindRequestsParam } from "requests/dtos/requests.dto";
import { Roles } from "auth/roles.decorator";
import { AuthService } from "auth/auth.service";
import { RequestGuard } from "auth/guards/request.guard";

@Controller('requests')
@ApiTags('requests')
@UseGuards(AuthGuard(CONSTANTS.AUTH_JWT), RequestGuard)
export class HistoriesController {
    constructor(
        @InjectRepository(TokenDto)
        private readonly authService: AuthService,
        private readonly requestService: RequestService,
    ) {
    }

    /* List Requests by projectId*/
    /*--------------------------------------------*/
    @ApiOperation({ tags: ['List Request by projectId'] })
    @ApiResponse({ status: 200, description: 'List Request by projectId.' })
    @Get(':projectId')
    async findRequestsByProjectId(@Query() findRequestsQuery: FindRequestsQuery,
        @Param() requestsParam: FindRequestsParam, @Req() req) {
        const payload = this.authService.decode(req);
        findRequestsQuery.tokenId = payload['id'];
        findRequestsQuery.projectId = requestsParam.projectId;
        return this.requestService.findRequests(findRequestsQuery);
    }

    /* List Requests*/
    /*--------------------------------------------*/
    @ApiOperation({ tags: ['List Request'] })
    @ApiResponse({ status: 200, description: 'List Request.' })
    @Roles([CONSTANTS.ROLE.ADMIN])
    @Get()
    async findRequests(@Query() findRequestsQuery: FindRequestsQuery) {
        return this.requestService.findRequests(findRequestsQuery);
    }
}