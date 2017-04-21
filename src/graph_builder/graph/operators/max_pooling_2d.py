from typing import Dict

from graph_builder.graph.operator import Operator
from graph_builder.graph.axis import Axis
from graph_builder.graph.operators.attributes.post_axiswise import PostAxiswise
from graph_builder.graph.operators.attributes.post_elementwise import PostElementwise
from graph_builder.graph.variable import Variable
from graph_builder.graph.variables.attributes.order import OrderNCHW, OrderNHWC


class MaxPooling2D(Operator):
    """
    Max pooling (2D) レイヤー
    padding挙動はchainer準拠 (cover_allに注意)
    """
    attributes = {PostElementwise,
                  PostAxiswise}

    def __init__(self, name: str, parameters: Dict[str, object]):
        """
        weights["W"]: (kh, kw, in_size, out_size)
        parameters: {ksize: Tuple[int, int], stride: Tuple[int, int], pad: Tuple[int, int], cover_all: Boolean=True}
        :param name: 
        :param parameters: 
        """
        assert "ksize" in parameters
        assert "stride" in parameters
        assert "padding" in parameters
        parameters["cover_all"] = parameters.get("cover_all", False)
        super().__init__(name, parameters)

    def __call__(self, x: Variable):
        x_shape_dict = x.shape_dict
        N = x_shape_dict[Axis.N]
        # Chainerにおけるcover_all=Trueでサイズを計算するので、Convolution, AveragePoolingと異なる値になる
        H2 = (x_shape_dict[Axis.H] + 2 * self.parameters["padding"][0] + self.parameters["stride"][0] -
              self.parameters["ksize"][0] - 1) // self.parameters["stride"][0] + 1
        W2 = (x_shape_dict[Axis.W] + 2 * self.parameters["padding"][1] + self.parameters["stride"][1] -
              self.parameters["ksize"][1] - 1) // self.parameters["stride"][1] + 1
        C2 = x_shape_dict[Axis.C]

        if x.axis_order == OrderNCHW:
            var_shape = [N, C2, H2, W2]
        elif x.axis_order == OrderNHWC:
            var_shape = [N, H2, W2, C2]
        else:
            raise NotImplementedError()
        y = Variable(var_shape, x.axis_order)
        self.append_input("x", x)
        self.append_output("y", y)
        return y,