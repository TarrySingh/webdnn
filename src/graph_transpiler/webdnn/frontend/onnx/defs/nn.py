"""
https://github.com/onnx/onnx/blob/09ada0f107f1cc1877f9194475c98d2d8512e188/onnx/defs/nn/defs.cc
"""

from webdnn.frontend.constraints import unify_order
from webdnn.frontend.onnx.converter import ONNXConverter, attribute_dict
from webdnn.frontend.onnx.type_hint import INodeProto
from webdnn.graph.operators.average_pooling_2d import AveragePooling2D
from webdnn.graph.operators.convolution2d import Convolution2D
from webdnn.graph.operators.max_pooling_2d import MaxPooling2D
from webdnn.graph.order import OrderC, OrderNCHW
from webdnn.util import console


@ONNXConverter.register_handler("AveragePool")
def _convert_average_pool(converter: ONNXConverter, onnx_op: INodeProto):
    x = converter.get_variable(onnx_op.input[0])
    unify_order(x.order, OrderNCHW)

    attrs = attribute_dict(onnx_op)
    ksize = list(attrs["kernel_shape"].ints)
    dilations = list(attrs["dilations"].ints)
    if any(d != 1 for d in dilations):
        raise NotImplementedError("[ONNXConverter] AveragePool is supported only when dilations are 1.")

    stride = list(attrs["strides"].ints)

    pad = list(attrs["pads"].ints)
    if len(pad) == 2:
        # FIXME: In PyTorch, pads is generated as tuple of 2 ints. It's maybe PyTorch's bug.
        pass

    else:
        if any(pad[2 * i] != pad[2 * i + 1] for i in range(len(pad) // 2)):
            raise NotImplementedError("[ONNXConverter] odd-size padding is not supported.")
        pad = [pad[0], pad[2]]

    y, = AveragePooling2D(None, ksize=ksize, stride=stride, padding=pad)(x)
    converter.set_variable(onnx_op.output[0], y)


@ONNXConverter.register_handler("MaxPool")
def _convert_max_pool(converter: ONNXConverter, onnx_op: INodeProto):
    x = converter.get_variable(onnx_op.input[0])
    unify_order(x.order, OrderNCHW)

    attrs = attribute_dict(onnx_op)
    ksize = list(attrs["kernel_shape"].ints)
    dilations = list(attrs["dilations"].ints)
    if any(d != 1 for d in dilations):
        raise NotImplementedError("[ONNXConverter] MaxPool is supported only when dilations are 1.")

    stride = list(attrs["strides"].ints)

    pad = list(attrs["pads"].ints)
    if len(pad) == 2:
        # FIXME: In PyTorch, pads is generated as tuple of 2 ints. It's maybe PyTorch's bug.
        pass

    else:
        if any(pad[2 * i] != pad[2 * i + 1] for i in range(len(pad) // 2)):
            raise NotImplementedError("[ONNXConverter] odd-size padding is not supported.")
        pad = [pad[0], pad[2]]

    y, = MaxPooling2D(None, ksize=ksize, stride=stride, padding=pad)(x)
    converter.set_variable(onnx_op.output[0], y)


@ONNXConverter.register_handler("Conv")
def _convert_conv(converter: ONNXConverter, onnx_op: INodeProto):
    x = converter.get_variable(onnx_op.input[0])
    unify_order(x.order, OrderNCHW)

    w = converter.get_variable(onnx_op.input[1])
    unify_order(w.order, OrderNCHW)

    attrs = attribute_dict(onnx_op)
    ksize = list(attrs["kernel_shape"].ints)
    dilations = list(attrs["dilations"].ints)
    stride = list(attrs["strides"].ints)

    pad = list(attrs["pads"].ints)
    if any(pad[2 * i] != pad[2 * i + 1] for i in range(len(pad) // 2)):
        raise NotImplementedError("[ONNXConverter] odd-size padding is not supported.")
    pad = [pad[0], pad[2]]

    y, = Convolution2D(None, ksize=ksize, stride=stride, padding=pad, dilation_rate=dilations)(x, w)

    if len(onnx_op.input) == 3:
        # with bias
        b = converter.get_variable(onnx_op.input[2])
        unify_order(b.order, OrderC)
        y = y + b

    converter.set_variable(onnx_op.output[0], y)


@ONNXConverter.register_handler("ConvTranspose")
def _convert_conv_transpose(converter: ONNXConverter, onnx_op: INodeProto):
    # FIXME: It's possible to support in current version of webdnn
    raise NotImplementedError("[ONNXConverter] Operator \"ConvTranspose\" is not supported yet.")


@ONNXConverter.register_handler("GlobalAveragePool")
def _convert_global_average_pool(converter: ONNXConverter, onnx_op: INodeProto):
    # FIXME: It's possible to support in current version of webdnn
    raise NotImplementedError("[ONNXConverter] Operator \"GlobalAveragePooling\" is not supported yet.")


@ONNXConverter.register_handler("GlobalMaxPool")
def _convert_global_max_pool(converter: ONNXConverter, onnx_op: INodeProto):
    # FIXME: It's possible to support in current version of webdnn
    raise NotImplementedError("[ONNXConverter] Operator \"GlobalMaxPool\" is not supported yet.")


@ONNXConverter.register_handler("BatchNormalization")
def _convert_batch_normalization(converter: ONNXConverter, onnx_op: INodeProto):
    # FIXME: It's possible to support in current version of webdnn
    raise NotImplementedError("[ONNXConverter] Operator \"BatchNormalization\" is not supported yet.")


@ONNXConverter.register_handler("Dropout")
def _convert_max_pool(converter: ONNXConverter, onnx_op: INodeProto):
    console.warning("[ONNXConverter] Operator \"Dropout\" is ignored")
    x = converter.get_variable(onnx_op.input[0])
    converter.set_variable(onnx_op.output[0], x)


@ONNXConverter.register_handler("Flatten")
def _convert_flatten(converter: ONNXConverter, onnx_op: INodeProto):
    # FIXME: It's possible to support in current version of webdnn
    raise NotImplementedError("[ONNXConverter] Operator \"Flatten\" is not supported yet.")


@ONNXConverter.register_handler("LRN")
def _convert_lrn(converter: ONNXConverter, onnx_op: INodeProto):
    # FIXME: It's possible to support in current version of webdnn
    raise NotImplementedError("[ONNXConverter] Operator \"LRN\" is not supported yet.")